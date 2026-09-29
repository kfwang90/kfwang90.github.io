---
title: Kubernetes 1.20 集群搭建：kubeadm + Docker + Weave 实战笔记
date: 2026-09-29 10:00:00
tags:
  - Kubernetes
  - Linux
description: 从配置阿里云 yum 源到 kubeadm 1.20 初始化 Master、加入 Worker、部署 Weave 网络插件的完整集群搭建记录。
---

跟着《kubernetes 权威指南》在虚拟机上把一套 1 主 2 从的集群搭起来的全过程，版本组合是 CentOS 7 + Docker 18.09 + Kubernetes 1.20。中间每一步的命令和实际输出都留了记录，方便以后复现。文中实验环境的登录口令与邮箱已做脱敏处理。

## 一、实验环境

```text
1.测试节点
192.168.137.100

2.k8s 节点
192.168.137.101
192.168.137.102
192.168.137.103

nero/<密码>
root/<密码>
```

## 二、设置安装源

```bash
#kubernetes 源
cd /etc/yum.repos.d/
vi kuberneyes.repo  #内容如下
```

```text
[kubernetes]
name=Kubernetes Repo
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
enable=1
```

```bash
#docker 源
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
sed -i 's+download.docker.com+mirrors.aliyun.com/docker-ce+' /etc/yum.repos.d/docker-ce.repo

#清理源
yum makecache fast
```

## 三、关闭 swap 和防火墙

```bash
sed -i 's#enforcing#disabled#g' /etc/selinux/config
swapoff -a #临时关闭 swap，编辑 /etc/fstab，注释掉包含 swap 的那一行即可，重启后可永久关闭
systemctl disable --now firewalld
```

## 四、时间同步与时区

```bash
echo '#Timing synchronization time' >>/var/spool/cron/root
echo '0 */1 * * * /usr/sbin/ntpdate ntp1.aliyun.com &>/dev/null' >>/var/spool/cron/root

vi /etc/profile  #最后新增
```

```text
TZ='Asia/Shanghai'
export TZ
```

```bash
source /etc/profile
```

## 五、安装 Docker 与 Kubernetes

```bash
#删除历史包
yum erase -y docker docker-ce docker-common docker-client docker-ce-cli docker-scan-plugin kubelet kubectl kubeadm kubernetes-cni

#查看是否还存在历史包
rpm -qa|grep docker
rpm -qa|grep kube

#安装 docker
yum -y install docker-ce-18.09.9-3.el7 docker-ce-cli-18.09.9-3.el7
```

修改 docker 镜像源，`/etc/docker/daemon.json`：

```json
{
"registry-mirrors":["https://registry.aliyuncs.com/"],
"insecure-registries":["registry.aliyuncsc.com"],
 "exec-opts": ["native.cgroupdriver=systemd"],
 "log-driver": "json-file",
 "log-opts": {
   "max-size": "100m"
 },
 "storage-driver": "overlay2"
}
```

```bash
systemctl enable docker && systemctl start docker
docker info

#指定版本安装 kubernetes，高版本（1.24 之后）默认使用 containerd 作为运行环境
yum install -y kubelet-1.20.0 kubeadm-1.20.0 kubectl-1.20.0

#安装之后启动（失败也没有影响）
systemctl enable kubelet && systemctl start kubelet
```

## 六、修改系统参数

在具体运行 kubernetes 部署之前需要对 Docker 的配置信息进行一些调整。编辑 `/etc/default/grub`，在配置项 `GRUB_CMDLINE_LINUX` 中添加如下参数：

```text
GRUB_CMDLINE_LINUX=" cgroup_enable=memory swapaccount=1"
```

修改之后 `reboot`。

## 七、提前下载 Kubernetes 依赖镜像

初始化节点需要这些镜像，可以提前拉下来并打上 `k8s.gcr.io` 的标签：

```bash
docker login --username=<邮箱> registry.cn-hangzhou.aliyuncs.com

docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-apiserver-amd64:v1.20.0
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-controller-manager-amd64:v1.20.0
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-scheduler-amd64:v1.20.0
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-proxy-amd64:v1.20.0
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.2
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/etcd:3.4.13-0
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/coredns:1.7.0

docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-scheduler-amd64:v1.20.0 k8s.gcr.io/kube-scheduler:v1.20.0
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-controller-manager-amd64:v1.20.0 k8s.gcr.io/kube-controller-manager:v1.20.0
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-apiserver-amd64:v1.20.0 k8s.gcr.io/kube-apiserver:v1.20.0
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-proxy-amd64:v1.20.0 k8s.gcr.io/kube-proxy:v1.20.0
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.2 k8s.gcr.io/pause:3.2
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/etcd:3.4.13-0 k8s.gcr.io/etcd:3.4.13-0
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/coredns:1.7.0 k8s.gcr.io/coredns:1.7.0
```

## 八、部署 Master 节点

Kubernetes 中 Master 节点是集群的控制节点，由三个紧密协作的独立组件构成：负责 API 服务的 kube-apiserver、负责调度的 kube-scheduler、负责容器编排的 kube-controller-manager，整个集群的持久化数据由 kube-apiserver 处理后保存在 Etcd 中。

可以先写好配置文件 `kubeadm.yaml`：

```yaml
apiVersion: kubeadm.k8s.io/v1beta2
kind: ClusterConfiguration
controllerManager:
  extraArgs:
    horizontal-pod-autoscaler-use-rest-clients: "true"
    horizontal-pod-autoscaler-sync-period: "10s"
    node-monitor-grace-period: "10s"
apiServer:
  extraArgs:
    runtime-config: "api/all=true"
kubernetesVersion: "v1.20.0"
```

或者直接执行：

```bash
kubeadm init --kubernetes-version=1.20.0 \
--apiserver-advertise-address=10.70.36.251 \
--image-repository registry.cn-hangzhou.aliyuncs.com/google_containers \
--service-cidr=10.1.0.0/16 \
--pod-network-cidr=10.244.0.0/16
```

实际执行 `kubeadm init --config kubeadm.yaml --v=5`，关键输出如下（preflight 逐行校验、证书签发明细等冗长日志已省略）：

```text
[init] Using Kubernetes version: v1.20.0
[preflight] Running pre-flight checks
[preflight] Pulling images required for setting up a Kubernetes cluster
[preflight] This might take a minute or two, depending on the speed of your internet connection
[preflight] You can also perform this action in beforehand using 'kubeadm config images pull'
[certs] Using certificateDir folder "/etc/kubernetes/pki"
[certs] Generating "ca" certificate and key
[certs] Generating "apiserver" certificate and key
[certs] Generating "apiserver-kubelet-client" certificate and key
[certs] Generating "front-proxy-ca" certificate and key
[certs] Generating "front-proxy-client" certificate and key
[certs] Generating "etcd/ca" certificate and key
[certs] Generating "etcd/server" certificate and key
[certs] Generating "etcd/peer" certificate and key
[certs] Generating "etcd/healthcheck-client" certificate and key
[certs] Generating "apiserver-etcd-client" certificate and key
[certs] Generating "sa" key and public key
[kubeconfig] Using kubeconfig folder "/etc/kubernetes"
[kubeconfig] Writing "admin.conf" kubeconfig file
[kubeconfig] Writing "kubelet.conf" kubeconfig file
[kubeconfig] Writing "controller-manager.conf" kubeconfig file
[kubeconfig] Writing "scheduler.conf" kubeconfig file
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Starting the kubelet
[control-plane] Using manifest folder "/etc/kubernetes/manifests"
[control-plane] Creating static Pod manifest for "kube-apiserver"
[control-plane] Creating static Pod manifest for "kube-controller-manager"
[control-plane] Creating static Pod manifest for "kube-scheduler"
[etcd] Creating static Pod manifest for local etcd in "/etc/kubernetes/manifests"
[wait-control-plane] Waiting for the API server to be healthy
[wait-control-plane] Waiting for the kubelet to boot up the control plane as static Pods from directory "/etc/kubernetes/manifests". This can take up to 4m0s
[apiclient] All control plane components are healthy after 12.003621 seconds
[upload-config] Storing the configuration used in ConfigMap "kubeadm-config" in the "kube-system" Namespace
[upload-config] Uploading the kubelet component config to a ConfigMap
[mark-control-plane] Marking the node k8s-master as control-plane by adding the labels "node-role.kubernetes.io/master=''"
[mark-control-plane] Marking the node k8s-master as control-plane by adding the taints [node-role.kubernetes.io/master:NoSchedule]
[bootstrap-token] Using token: x7b4pz.864umfoca6708oh7
[bootstrap-token] Configuring bootstrap tokens, cluster-info ConfigMap, RBAC Roles
[bootstrap-token] Creating the "cluster-info" ConfigMap in the "kube-public" namespace
[addons] Applied essential addon: CoreDNS
[addons] Applied essential addon: kube-proxy
```

初始化成功：

```text
Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.137.200:6443 --token x7b4pz.864umfoca6708oh7 \
    --discovery-token-ca-cert-hash sha256:f850df21d73b952b491f95005a0ba2d1696b6d844bba5338e7f2eb7ca1ee9492
```

按上面的提示配置好 kubectl 之后，查看节点状态：

```bash
kubectl get nodes
```

```text
NAME         STATUS     ROLES                  AGE     VERSION
k8s-master   NotReady   control-plane,master   6m40s   v1.20.0
```

节点是 `NotReady`，先查具体原因：

```bash
kubectl describe node k8s-master
```

```text
  Ready            False   Sat, 17 Dec 2022 16:28:42 +0800   Sat, 17 Dec 2022 16:28:42 +0800   KubeletNotReady              runtime network not ready: NetworkReady=false reason:NetworkPluginNotReady message:docker: network plugin is not ready: cni config uninitialized
```

再看系统 Pod 的状态：

```bash
kubectl get pods -n kube-system
```

```text
NAME                                 READY   STATUS    RESTARTS   AGE
coredns-74ff55c5b-d2rfm              0/1     Pending   0          8m56s
coredns-74ff55c5b-jzt8v              0/1     Pending   0          8m56s
etcd-k8s-master                      1/1     Running   0          8m57s
kube-apiserver-k8s-master            1/1     Running   0          8m57s
kube-controller-manager-k8s-master   1/1     Running   0          8m57s
kube-proxy-ntm68                     1/1     Running   0          8m56s
kube-scheduler-k8s-master            1/1     Running   0          8m57s
```

`kube-system` 是 Kubernetes 预留的系统 Pod 空间（Namespace），注意它并不是 Linux Namespace，而是 Kubernetes 划分的工作空间单位。可以看到 CoreDNS 等依赖网络的 Pod 都处于 Pending（调度失败）状态，说明该 Master 节点的网络尚未部署就绪。

### 部署网络插件

在「一切皆容器」的设计理念下，网络插件也以独立 Pod 的方式运行，直接 `kubectl apply` 即可，以 Weave 网络插件为例（官网：<https://www.weave.works/docs/net/latest/kubernetes/kube-addon/>）：

```bash
[root@k8s-master ~]# kubectl apply -f https://github.com/weaveworks/weave/releases/download/v2.8.1/weave-daemonset-k8s.yaml
serviceaccount/weave-net created
clusterrole.rbac.authorization.k8s.io/weave-net created
clusterrolebinding.rbac.authorization.k8s.io/weave-net created
role.rbac.authorization.k8s.io/weave-net created
rolebinding.rbac.authorization.k8s.io/weave-net created
daemonset.apps/weave-net created

#再次查看节点，变成了 Ready 状态
[root@k8s-master ~]# kubectl get nodes
NAME         STATUS   ROLES                  AGE   VERSION
k8s-master   Ready    control-plane,master   27m   v1.20.0
```

## 九、部署 Worker 节点

每个节点执行：

```bash
[root@k8s-node-1 ~]# kubeadm join 192.168.137.200:6443 --token x7b4pz.864umfoca6708oh7 --discovery-token-ca-cert-hash sha256:f850df21d73b952b491f95005a0ba2d1696b6d844bba5338e7f2eb7ca1ee9492
[preflight] Running pre-flight checks
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Starting the kubelet
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...

This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```

## 十、Worker 节点使用 kubectl

完成集群加入后，为了便于在 Worker 节点执行 kubectl 相关命令，需要进行如下配置：

```bash
mkdir -p $HOME/.kube
#从主节点拷贝文件
scp .kube/config root@192.168.137.201:$HOME/.kube/
scp .kube/config root@192.168.137.202:$HOME/.kube/
```

这样在 node 节点也可以执行：

```bash
[root@k8s-node-1 ~]# kubectl get nodes
NAME         STATUS   ROLES                  AGE     VERSION
k8s-master   Ready    control-plane,master   42m     v1.20.0
k8s-node-1   Ready    <none>                 10m     v1.20.0
k8s-node-2   Ready    <none>                 8m57s   v1.20.0

[root@k8s-node-1 ~]# kubectl get pods --all-namespaces
NAMESPACE     NAME                                 READY   STATUS    RESTARTS   AGE
kube-system   coredns-74ff55c5b-d2rfm              1/1     Running   0          42m
kube-system   coredns-74ff55c5b-jzt8v              1/1     Running   0          42m
kube-system   etcd-k8s-master                      1/1     Running   0          42m
kube-system   kube-apiserver-k8s-master            1/1     Running   0          42m
kube-system   kube-controller-manager-k8s-master   1/1     Running   0          42m
kube-system   kube-proxy-4gjx7                     1/1     Running   0          9m9s
kube-system   kube-proxy-5dv6r                     1/1     Running   0          10m
kube-system   kube-proxy-ntm68                     1/1     Running   0          42m
kube-system   kube-scheduler-k8s-master            1/1     Running   0          42m
kube-system   weave-net-6b22v                      2/2     Running   1          17m
kube-system   weave-net-6k7g7                      2/2     Running   0          9m9s
kube-system   weave-net-ms45j                      2/2     Running   0          10m
```

Worker 节点的 ROLES 有时会显示 `<none>` 而不是 `master`，新装的 Kubernetes 环境会丢失 ROLES 信息，手工补一下即可：

```bash
kubectl label node k8s-node-1 node-role.kubernetes.io/worker=worker
kubectl label node k8s-node-2 node-role.kubernetes.io/worker=worker

[root@k8s-node-1 ~]# kubectl get nodes
NAME         STATUS   ROLES    AGE   VERSION
k8s-master   Ready    master   43m   v1.20.0
k8s-node-1   Ready    worker   11m   v1.20.0
k8s-node-2   Ready    worker   10m   v1.20.0
```

到这里就部署完成了具有一个 Master 节点和两个 Worker 节点的 Kubernetes 集群，作为实验环境它已经具备了基本的 Kubernetes 集群功能。

## 十一、其他说明

安装失败时，可以执行 `kubeadm reset` 命令将主机恢复原状：

```bash
kubeadm reset
```

kubelet 启动参数存放在 `/etc/sysconfig/kubelet`。
