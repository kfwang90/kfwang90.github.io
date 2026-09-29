---
title: Kubernetes kubectl 常用命令速查
date: 2026-09-29 12:00:00
tags:
  - Kubernetes
description: 整理 kubectl 命令行语法与 17 类常用操作，覆盖创建、调度策略、滚动更新与回滚、扩缩容、Service 和节点隔离。
---

这篇笔记整理 `kubectl` 的命令行语法，以及日常排障最常用的 17 类操作，示例全部来自 k8s 1.20 实验环境的真实执行记录，可以直接当作速查手册使用。

## 一、命令行语法

```text
kubectl [command] [TYPE] [NAME] [flags]
```

- `command`：子命令，例如 `create`、`delete`、`describe`、`get`、`apply`
- `TYPE`：资源对象的类型，区分大小写，可以用单数、复数或简写表示
- `NAME`：资源名称
- `flags`：子命令的可选参数

下面三条命令等价（`pods` / `pod` / `po` 是同一个资源的三种写法）：

```bash
kubectl get pods pod1
kubectl get pod pod1
kubectl get po pod1
```

## 二、常用操作

### 1. 创建资源对象

```bash
kubectl create -f my-service.yaml -f my-rc.yaml

#根据目录创建目录下的所有文件
kubectl create -f dir/
```

新建 `nginx-deployment.yaml`，其中 `replicas` 决定副本数量，也可以事后用 `kubectl edit deployment/nginx-deployment` 修改：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 4  #修改这个参数，调整副本数量，kubectl edit deployment/nginx-deployment 可以修改
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.18.0
        ports:
        - containerPort: 80
```

新建 `nginx-service.yaml`，类型为 `NodePort`，把 80 端口暴露到节点的 30080：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  type: NodePort
  ports:
  - port: 80
    nodePort: 30080
  selector:
    app: nginx
```

创建之后即可在浏览器访问：`http://192.168.137.200:30080/`

### 2. 查看资源状态

```bash
kubectl get pods -o wide -n nero
kubectl get rc,service
```

### 3. 描述资源对象

```bash
kubectl describe nodes node-name
kubectl describe pods/pod-name
kubectl describe pods rc-name
```

### 4. 删除资源对象

```bash
kubectl delete -f pod.yaml
kubectl delete pods,services -l name=label-name
kubectl delete pods --all
kubectl stop rc xxx
```

> `kubectl stop` 在新版本中已经废弃，统一用 `kubectl delete`。

### 5. 执行容器的命令

```bash
kubectl exec pod-name date
kubectl exec pod-name -c container-name date
kubectl exec -it pod-name -c container-name /bin/bash
```

### 6. 查看容器的日志

```bash
kubectl logs pod-name
kubectl logs -f pod-name -c container-name
```

### 7. NodeSelector 打标签，节点定向调度

```bash
kubectl get no --show-labels #查看标签
kubectl label nodes k8s-node-1 zone=north  #打标签
```

### 8. NodeAffinity 与 PodAffinity 亲和性调度

NodeAffinity 为节点亲和性调度，PodAffinity 为 Pod 亲和性调度，作用是让 Pod 按我们的要求调度到指定的 Node 上（《kubernetes 权威指南》130 页）。

新建 `nginx-pod.yaml`，下面的配置是**互斥性测试**（`podAntiAffinity`，不与同样带 `app=nginx` 标签的 Pod 落在同一台节点上）：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  affinity:
    #podAffinity: #亲和性测试
    podAntiAffinity: #互斥性测试
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - nginx
        topologyKey: kubernetes.io/hostname
  containers:
  - name: with-pod-affinity
    image: k8s.gcr.io/pause:3.2
```

### 9. Taints 和 Tolerations（污点与容忍）

可以让 Node 拒绝运行 Pod，甚至驱逐 Node 上已有的 Pod。

```bash
#执行之后，调度 Pod 就只会落到 k8s-node-1 上，除非 Pod 添加了 tolerations 配置
kubectl taint nodes k8s-node-2 key=value:NoSchedule

#详解
kubectl taint node [node] key=value[effect]

#其中 [effect] 可取值：
#  NoSchedule      一定不能被调度
#  PreferNoSchedule 尽量不要调度
#  NoExecute       不仅不会调度，还会驱逐 Node 上已有的 Pod

#查看 taints
kubectl describe node k8s-master
#可以看到一行：Taints:             node-role.kubernetes.io/master:NoSchedule

#删除 taints（注意后面的减号）
kubectl taint nodes k8s-node-2 key-
#再次查看，变成了：Taints:             <none>
```

### 10. DaemonSet

在每个 Node 上调度一个 Pod，且仅运行 1 份，典型的如监控 Pod。

### 11. Pod 的升级和滚动更新

先用 `kubectl get deployment` 查到 Deployment 名称，然后有两种升级方式。第一种是直接更换镜像版本（把原来的 1.7.9 更新为 1.9.1）：

```bash
kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1

#查看更新状态
[root@k8s-master kubelet]# kubectl get pods
NAME                                READY   STATUS              RESTARTS   AGE
nginx-deployment-67dfd6c8f9-vwmvg   1/1     Running             0          132m
nginx-deployment-69c44dfb78-kzx2w   0/1     ContainerCreating   0          16s

#查看详细过程
kubectl describe pod nginx-deployment-69c44dfb78-kzx2w
#可以看到：Successfully pulled image "nginx:1.9.1" in 20.949824149s
```

第二种是直接编辑 yaml（把 1.9.1 修改为 1.17.0）：

```bash
kubectl edit deployment/nginx-deployment

#修改对应的版本保存，会自动触发滚动升级，通过 rollout status 查看状态
[root@k8s-master kubelet]# kubectl rollout status deployment/nginx-deployment
deployment "nginx-deployment" successfully rolled out
```

这两种方式都会新增一个 ReplicaSet，并替换掉旧的 ReplicaSet：

```bash
[root@k8s-master kubelet]# kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-56fdbbbdc8   1         1         1       4m13s  #第二种方法产生的
nginx-deployment-67dfd6c8f9   0         0         0       3d15h  #最开始的
nginx-deployment-69c44dfb78   0         0         0       7m19s  #第一种方法产生的
```

执行过程日志：

```bash
[root@k8s-master kubelet]# kubectl describe deployment/nginx-deployment
Name:                   nginx-deployment
Namespace:              default
CreationTimestamp:      Sat, 17 Dec 2022 19:55:37 +0800
Labels:                 <none>
Annotations:            deployment.kubernetes.io/revision: 4
Selector:               app=nginx
Replicas:               1 desired | 1 updated | 1 total | 1 available | 0 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  25% max unavailable, 25% max surge
Pod Template:
  Labels:  app=nginx
  Containers:
   nginx:
    Image:        nginx:1.17.0
    Port:         80/TCP
    Host Port:    0/TCP
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
Conditions:
  Type           Status  Reason
  ----           ------  ------
  Available      True    MinimumReplicasAvailable
  Progressing    True    NewReplicaSetAvailable
OldReplicaSets:  <none>
NewReplicaSet:   nginx-deployment-56fdbbbdc8 (1/1 replicas created)
Events:
  Type    Reason             Age    From                   Message
  ----    ------             ----   ----                   -------
  Normal  ScalingReplicaSet  8m18s  deployment-controller  Scaled up replica set nginx-deployment-69c44dfb78 to 1
  Normal  ScalingReplicaSet  7m56s  deployment-controller  Scaled down replica set nginx-deployment-67dfd6c8f9 to 0
  Normal  ScalingReplicaSet  5m12s  deployment-controller  Scaled up replica set nginx-deployment-56fdbbbdc8 to 1
  Normal  ScalingReplicaSet  4m51s  deployment-controller  Scaled down replica set nginx-deployment-69c44dfb78 to 0
```

更新策略说明：通过 Deployment 的 `spec.strategy.type` 为 `RollingUpdate` 或 `Recreate` 决定是滚动更新还是重建（Recreate 是先删掉再重建）。`maxUnavailable` 用于指定更新过程中不可用的副本数，百分比设置向下取整；`maxSurge` 用于指定更新 Pod 过程中 Pod 总数允许超过期望副本数的最大值。

### 12. Pod 的回滚

假设更新过程中设置了一个错误的 nginx 镜像版本：

```bash
kubectl set image deployment/nginx-deployment nginx=nginx:1.91
```

会发现部署过程被卡住：

```bash
[root@k8s-master kubelet]# kubectl rollout status deployment/nginx-deployment
Waiting for deployment "nginx-deployment" rollout to finish: 1 old replicas are pending termination...  #被卡住

[root@k8s-master kubelet]# kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-56fdbbbdc8   1         1         1       16m
nginx-deployment-67dfd6c8f9   0         0         0       3d15h
nginx-deployment-69c44dfb78   0         0         0       19m
nginx-deployment-d645d84b6    1         1         0       68s  #新的 rs 创建卡住

[root@k8s-master kubelet]# kubectl get pods
NAME                                READY   STATUS             RESTARTS   AGE
nginx-deployment-56fdbbbdc8-fk7qk   1/1     Running            0          16m
nginx-deployment-d645d84b6-ldlxb    0/1     ImagePullBackOff   0          105s  #新的镜像下拉失败
```

这时开始回滚上一个版本，先查看历史版本：

```bash
[root@k8s-master kubelet]# kubectl rollout history deployment/nginx-deployment
deployment.apps/nginx-deployment
REVISION  CHANGE-CAUSE
2         <none>
3         <none>
4         <none>
5         <none>
```

> 这里没有显示 CHANGE-CAUSE，是因为创建 Deployment 的时候没有使用 `--record` 参数，但仍然可以通过 `--revision` 查看每个版本的 Pod 模板。

```bash
#查看 revision 5（错误版本）
[root@k8s-master kubelet]# kubectl rollout history deployment/nginx-deployment --revision=5
deployment.apps/nginx-deployment with revision #5
Pod Template:
  Labels:	app=nginx
	pod-template-hash=d645d84b6
  Containers:
   nginx:
    Image:	nginx:1.91
    Port:	80/TCP
    Host Port:	0/TCP
    Environment:	<none>
    Mounts:	<none>
  Volumes:	<none>

#查看 revision 4（正常版本）
[root@k8s-master kubelet]# kubectl rollout history deployment/nginx-deployment --revision=4
deployment.apps/nginx-deployment with revision #4
Pod Template:
  Labels:	app=nginx
	pod-template-hash=56fdbbbdc8
  Containers:
   nginx:
    Image:	nginx:1.17.0
    Port:	80/TCP
    Host Port:	0/TCP
    Environment:	<none>
    Mounts:	<none>
  Volumes:	<none>
```

回到最近一次正常的版本：

```bash
[root@k8s-master kubelet]# kubectl rollout undo deployment/nginx-deployment
deployment.apps/nginx-deployment rolled back

#或者回到指定的某个版本
kubectl rollout undo deployment/nginx-deployment --to-revision=4
#再次查看已恢复到 1.17.0 版本
```

备用技巧：`kubectl rollout pause deployment/nginx-deployment` 可以暂停某次更新，修改只会在 `kubectl rollout resume deployment/nginx-deployment` 恢复之后执行，避免频繁创建和销毁 RC。

### 13. Pod 的扩容、缩容

手动扩缩容，通过调整副本数量实现：

```bash
[root@k8s-master ~]# kubectl scale deployment nginx-deployment --replicas 2
deployment.apps/nginx-deployment scaled

[root@k8s-master ~]# kubectl get po
NAME                                READY   STATUS              RESTARTS   AGE
nginx-deployment-56fdbbbdc8-6rgkt   0/1     ContainerCreating   0          15s
nginx-deployment-56fdbbbdc8-fk7qk   1/1     Running             0          22h
```

自动扩缩容则基于 CPU 使用率自动调整 Pod 数量，需要满足三个前置条件：

1. 确保 master 节点 `kube-controller-manager` 的启动参数包含 `--horizontal-pod-autoscaler-sync-period=10s`，即每隔 10s 检测一次 Pod 的 CPU 使用率
2. 安装 metrics-server（容器集群监控和性能分析工具）：

   ```bash
   docker pull dyrnq/metrics-server:v0.6.2
   docker tag dyrnq/metrics-server:v0.6.2 k8s.gcr.io/metrics-server/metrics-server:v0.6.2
   kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/download/metrics-server-helm-chart-3.8.3/high-availability.yaml
   #上面的高可用 yaml 第 150 行新增一行参数：- --kubelet-insecure-tls
   ```

3. Deployment 中必须定义 `resources.requests.cpu` 参数（为了测试可以调低一点），否则采集不到 CPU 使用率

命令方式创建 HPA：

```bash
[root@k8s-master kubelet]# kubectl autoscale deployment nginx-deployment --min=2 --max=4 --cpu-percent=50
horizontalpodautoscaler.autoscaling/nginx-deployment autoscaled
```

yaml 方式创建，新建 `hpa-nginx-deployment.yaml`：

```yaml
apiVersion: autoscaling/v1
kind: HorizontalPodAutoscaler
metadata:
  name: nginx
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nginx
  minReplicas: 2
  maxReplicas: 4
  targetCPUUtilizationPercentage: 50
```

```bash
[root@k8s-master kubelet]# kubectl apply -f hpa-nginx-deployment.yaml
Warning: resource horizontalpodautoscalers/nginx-deployment is missing the kubectl.kubernetes.io/last-applied-configuration annotation which is required by kubectl apply. kubectl apply should only be used on resources created declaratively by either kubectl create --save-config or kubectl apply. The missing annotation will be patched automatically.
horizontalpodautoscaler.autoscaling/nginx-deployment configured

#查看创建的 hpa，TARGETS 显示 unknown 是因为还没有部署 metrics-server
[root@k8s-master kubelet]# kubectl get hpa
NAME               REFERENCE                     TARGETS         MINPODS   MAXPODS   REPLICAS   AGE
nginx-deployment   Deployment/nginx-deployment   <unknown>/50%   2         4         2          6m33s

#部署 metrics-server 之后执行
[root@k8s-master kubelet]# kubectl get hpa
NAME               REFERENCE                     TARGETS    MINPODS   MAXPODS   REPLICAS   AGE
nginx-deployment   Deployment/nginx-deployment   0%/50%     2         4         2          177m
```

开始模拟压测，创建一个 busybox 的 Pod：

```bash
[root@k8s-master kubelet]# cat busybox-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: busybox
spec:
  containers:
  - name: busybox
    image: busybox
    command: [ "sleep", "3600" ]
```

登录 busybox 容器，写个脚本持续 wget 访问 nginx-service：

```bash
vi wget.sh
while true
do
  wget -q -O- http://nginx-service > /dev/null;
done
sh wget.sh
```

再次查看 CPU 情况，已经自动扩容：

```bash
[root@k8s-node-1 ~]# kubectl get hpa
NAME               REFERENCE                     TARGETS    MINPODS   MAXPODS   REPLICAS   AGE
nginx-deployment   Deployment/nginx-deployment   147%/50%   2         4         4          4h5m

#查看单个 Pod 的 CPU
[root@k8s-node-1 ~]# kubectl top pod nginx-deployment-7bbd796796-gljws
NAME                                CPU(cores)   MEMORY(bytes)
nginx-deployment-7bbd796796-gljws   22m          2Mi

#发现自动扩容到 4 个
[root@k8s-node-1 ~]# kubectl get pods
NAME                                READY   STATUS              RESTARTS   AGE
busybox                             1/1     Running             0          28m
nginx-deployment-7bbd796796-gljws   1/1     Running             0          4m9s
nginx-deployment-7bbd796796-gstlr   1/1     Running             0          36s   #新扩展的
nginx-deployment-7bbd796796-nktvz   1/1     Running             0          36s   #新扩展的
nginx-deployment-7bbd796796-qktgz   1/1     Running             0          4m7s
```

登录 busybox 容器停止 wget 脚本，再等一段时间查看，CPU 降下来之后 Pod 数量也跟着下降：

```bash
[root@k8s-node-1 ~]# kubectl get hpa
NAME               REFERENCE                     TARGETS    MINPODS   MAXPODS   REPLICAS   AGE
nginx-deployment   Deployment/nginx-deployment   0%/50%     2         4         2          4h17m

[root@k8s-node-1 ~]# kubectl get pods
NAME                                READY   STATUS    RESTARTS   AGE
busybox                             1/1     Running   0          40m
nginx-deployment-7bbd796796-gljws   1/1     Running   0          15m
nginx-deployment-7bbd796796-qktgz   1/1     Running   0          15m
```

> 还可以自定义其他指标，比如每秒请求数、请求平均响应耗时或其他业务指标。

### 14. 重启 Deployment

```bash
kubectl rollout restart deployment.apps/nginx-deployment
```

### 15. StatefulSet

有状态应用，比如数据库集群，可以实现自动故障恢复，服务重启后数据不丢，Pod 名称不变。

### 16. Service 的基本用法

通过命令创建 Service：

```bash
[root@k8s-master kubelet]# kubectl expose deployment nginx-deployment
service/nginx-deployment exposed

[root@k8s-master kubelet]# kubectl get svc
NAME               TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
kubernetes         ClusterIP   10.96.0.1       <none>        443/TCP        4d22h
nginx-deployment   ClusterIP   10.105.104.63   <none>        80/TCP         4s     #新创建的 Service，80 端口是从 Pod 的 containerPort 中复制出来的
nginx-service      NodePort    10.97.94.240    <none>        80:30080/TCP   2d3h   #之前通过 yaml 创建的 NodePort 方式，可以通过 node ip 和端口访问

#通过 http 请求验证
curl http://10.105.104.63:80 -v
```

也可以通过 yaml 创建，新建 `nginx-cluster-service.yaml`：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-clusterip-service
spec:
  ports:
  - port: 81
    targetPort: 80
  sessionAffinity: ClientIP
  selector:
    app: nginx
```

```bash
[root@k8s-master kubelet]# kubectl apply -f nginx-cluster-service.yaml
service/nginx-clusterip-service created

[root@k8s-master kubelet]# kubectl get svc
NAME                      TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
kubernetes                ClusterIP   10.96.0.1        <none>        443/TCP        4d22h
nginx-clusterip-service   ClusterIP   10.104.180.125   <none>        81/TCP         21s    #新创建的，指定端口 81，curl http://10.104.180.125:81 -v 测试
nginx-deployment          ClusterIP   10.105.104.63    <none>        80/TCP         7m6s
nginx-service             NodePort    10.97.94.240     <none>        80:30080/TCP   2d3h
```

> 默认使用 RoundRobin 轮询模式请求后端，也可以通过 `service.spec.sessionAffinity=ClientIP` 启用基于客户端 IP 的会话保持。

删除 Service：

```bash
[root@k8s-master kubelet]# kubectl delete service nginx-deployment
service "nginx-deployment" deleted

[root@k8s-master kubelet]# kubectl get svc
NAME                      TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
kubernetes                ClusterIP   10.96.0.1        <none>        443/TCP        4d22h
nginx-clusterip-service   ClusterIP   10.104.180.125   <none>        81/TCP         11m
nginx-service             NodePort    10.97.94.240     <none>        80:30080/TCP   2d3h
```

### 17. 隔离某个 Node 节点

比如升级维护过程中把某个 Node 隔离起来，有三种方式。

第一种，创建配置文件 `unschedule_node.yaml`：

```yaml
apiVersion: v1
kind: Node
metadata:
  name: k8s-node-1
  labels:
    kubernetes.io/hostname: k8s-node-1
spec:
  unschedulable: true
```

```bash
#执行修改
[root@k8s-master kubelet]# kubectl replace -f unschedule_node.yaml
node/k8s-node-1 replaced

#查看 node 状态
[root@k8s-master kubelet]# kubectl get nodes
NAME         STATUS                        ROLES                  AGE     VERSION
k8s-master   Ready                         control-plane,master   5d23h   v1.20.0
k8s-node-1   NotReady,SchedulingDisabled   <none>                 5d22h   v1.20.0  #被禁用
k8s-node-2   Ready                         worker                 5d22h   v1.20.0
#后续就不会再有 Pod 调度到这台 Node 上
```

第二种，直接用命令打补丁：

```bash
kubectl patch node k8s-node-1 -p '{"spec":{"unschedulable":true}}'
#注意：节点上已经在运行的 Pod 不会自动停止，需要手动停止
#如 kubectl delete pod nginx-deployment-cb4fb774b-h5j5l
```

第三种，快捷命令：

```bash
kubectl cordon k8s-node-1   #隔离
kubectl uncordon k8s-node-1 #恢复
```

## 参考链接

- https://mp.weixin.qq.com/s/3PuxZpADqCoiIOxFmZHq0w
- https://cloud.tencent.com/developer/doc/1158
