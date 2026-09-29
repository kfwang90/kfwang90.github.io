---
title: Kubernetes 单节点实验：MySQL RC 部署与典型报错排查
date: 2026-09-29 11:00:00
tags:
  - Kubernetes
  - Linux
description: 单节点环境启动组件并部署 MySQL RC 的完整过程，附 service account token 缺失与镜像拉取失败两个典型报错的排查步骤。
---

这篇笔记记录在单节点环境下，用一个 `mysql-rc.yaml` 把 MySQL 跑起来的完整过程，重点是中间遇到的两个典型报错：service account token 缺失、`pod-infrastructure` 镜像拉取失败。

实验环境：`192.168.137.100`

## 一、环境准备

先关闭防火墙：

```bash
systemctl disable firewalld
systemctl stop firewalld
```

## 二、启动单节点组件

```bash
systemctl start etcd
systemctl start docker
systemctl start kube-apiserver
systemctl start kube-controller-manager
systemctl start kube-scheduler
systemctl start kubelet
systemctl start kube-proxy

#设置自动重启
systemctl enable etcd
systemctl enable docker
systemctl enable kube-apiserver
systemctl enable kube-controller-manager
systemctl enable kube-scheduler
systemctl enable kubelet
systemctl enable kube-proxy
```

## 三、编写 mysql-rc.yaml

```yaml
apiVersion: v1
kind: ReplicationController
metadata:
  name: mysql
spec:
  replicas: 1
  selector:
    app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: docker.io/mysql:5.7  #必须用5.7版本，latest会导致案例不通过
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3306
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: "123456"
```

## 四、创建 namespace 与 RC

```bash
#创建 namespace
kubectl create namespace nero

#创建 RC
kubectl create -f mysql-rc.yaml -n nero

#查看创建情况
kubectl get all -n nero
```

```text
NAME       DESIRED   CURRENT   READY     AGE
rc/mysql   1         0         0         9m
```

```bash
kubectl get pods -n nero
```

```text
No resources found.
```

## 五、问题排查一：No API token found for service account

一直加载不出 Pod 的情况，先查看日志：

```bash
kubectl describe rc/mysql -n nero
```

提示：

```text
Error creating: No API token found for service account "default", retry after the token is automatically created and added to the service account
```

需要配置 service account（参考：<https://blog.csdn.net/lusyoe/article/details/79673058>）：

```bash
#1、首先生成密钥
openssl genrsa -out /etc/kubernetes/serviceaccount.key 2048

#2、编辑 /etc/kubernetes/apiserver，添加以下内容
KUBE_API_ARGS="--service_account_key_file=/etc/kubernetes/serviceaccount.key"

#3、再编辑 /etc/kubernetes/controller-manager，添加以下内容
KUBE_CONTROLLER_MANAGER_ARGS="--service_account_private_key_file=/etc/kubernetes/serviceaccount.key"

#最后重启 kubernetes 服务
systemctl restart etcd kube-apiserver kube-controller-manager kube-scheduler
```

重启之后重新查看 Pod 创建情况：

```bash
kubectl get pods -o wide -n nero
```

```text
NAME          READY     STATUS              RESTARTS   AGE       IP        NODE
mysql-mzc22   0/1       ContainerCreating   0          13m       <none>    127.0.0.1
```

## 六、问题排查二：ErrImagePull 镜像拉取失败

继续查看日志：

```bash
kubectl describe pod mysql-mzc22 -n nero
```

```text
Error syncing pod, skipping: failed to "StartContainer" for "POD" with ErrImagePull: "image pull failed for registry.access.redhat.com/rhel7/pod-infrastructure:latest, this may be because there are no credentials on this request.  details: (open /etc/docker/certs.d/registry.access.redhat.com/redhat-ca.crt: no such file or directory)"
```

原因是缺少 redhat 的证书依赖包，按下面的步骤处理（参考：<https://www.jianshu.com/p/1703631ec802>）：

```bash
rm /etc/docker/certs.d/registry.access.redhat.com/redhat-ca.crt
yum install *rhsm*
docker pull registry.access.redhat.com/rhel7/pod-infrastructure:latest
```

重新查看 Pod 状态，此时已经 Running：

```bash
kubectl get pods -n nero
```

```text
NAME          READY     STATUS    RESTARTS   AGE
mysql-mzc22   1/1       Running   0          21m
```

## 七、修改配置后重新发布

修改 rc 配置之后，重新发布：

```bash
kubectl replace -f mysql-rc.yaml -n nero
```
