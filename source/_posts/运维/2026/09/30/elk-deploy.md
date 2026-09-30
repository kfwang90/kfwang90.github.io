---
title: ELK 6.8.0 日志归集平台部署手册（含全部启停脚本）
date: 2026-09-30 10:00:00
tags:
  - ELK
  - Linux
description: 一套 6 节点 ELK 6.8.0 日志归集平台的完整部署记录，含各组件安装配置、集群角色划分、filebeat.conf、全部启停脚本与 ARM 架构踩坑。
---

本文把 `elk6.8.0` 目录下的三份资料合并成一篇：部署手册、5 个组件的启停脚本、ARM 架构安装问题笔记，方便一次查全。

## 一、环境规划

集群分两组，共 6 台机器，两组使用不同的系统用户和目录：

```text
192.168.137.177-179
用户：kafka
用户目录：/app/kafka
服务目录：/app/kafka/elk6.8.0/
服务数据或日志：/app/kafka/data

192.168.137.180-182
用户：elk
用户目录：/app/elk
服务目录：/app/elk/elk6.8.0/
服务数据或日志：/app/elk/data
```

安装软件：

| 软件 | 版本 |
|---|---|
| Zookeeper | apache-zookeeper-3.5.7 |
| Kafka | kafka_2.11-2.4.0 |
| Elasticsearch | elasticsearch-6.8.5 |
| Kibana | kibana-6.8.5-linux-x86_64 |
| Logstash | logstash-6.8.5 |

## 二、上传并解压

```bash
#上传文件包 elk6.8.0.tar.gz 到 /app/kafka/soft 目录
mkdir /app/kafka/elk6.8.0/
cd /app/kafka/soft
tar -zxvf apache-zookeeper-3.5.7-bin.tar.gz -C /app/kafka/elk6.8.0/
tar -zxvf kafka_2.11-2.4.0.tgz -C /app/kafka/elk6.8.0/
tar -zxvf logstash-6.8.5.tar.gz -C /app/kafka/elk6.8.0/
tar -zxvf elasticsearch-6.8.5.tar.gz -C /app/kafka/elk6.8.0/
tar -zxvf kibana-6.8.5-linux-x86_64.tar.gz -C /app/kafka/elk6.8.0/
```

## 三、安装 Zookeeper

```bash
cd /app/kafka/elk6.8.0/apache-zookeeper-3.5.7-bin/conf
cp zoo_sample.cfg zoo.cfg
vi zoo.cfg
```

调整以下参数：

```text
dataDir=/app/kafka/data/zookeeper/zkData
dataLogDir=/app/kafka/data/zookeeper/zkDataLog
server.1=192.168.137.177:2888:3888
server.2=192.168.137.178:2888:3888
server.3=192.168.137.179:2888:3888
```

保存退出后创建数据目录，并写入本机的 `myid`：

```bash
cd /app/kafka
mkdir -p  /app/kafka/data/zookeeper/{zkData,zkDataLog}
cd data/zookeeper/zkData

#创建 myid（其他两台服务器分别为 2、3）
echo "1" > myid
```

## 四、安装 Kafka

```bash
cd /app/kafka/elk6.8.0/kafka_2.11-2.4.0/config
vi server.properties
```

调整以下参数：

```text
broker.id=1
host.name=192.168.137.177
port=9092
listeners=PLAINTEXT://192.168.137.177:9092
advertised.listeners=PLAINTEXT://192.168.137.177:9092
log.dirs=/app/kafka/data/kafka/logs
zookeeper.connect=192.168.137.177:2181,192.168.137.178:2181,192.168.137.179:2181
```

## 五、安装 Elasticsearch

```bash
cd /app/kafka/elk6.8.0/elasticsearch-6.8.5/config
vi elasticsearch.yml
```

调整以下参数：

```text
cluster.name: xxx-application
node.name: node-1
#177-179 设置为 true，180-182 设置为 false
node.master: true
#177-179 设置为 false，180-182 设置为 true
node.data: false
path.data: /app/kafka/data/elasticsearch/data
path.logs: /app/kafka/data/elasticsearch/logs
bootstrap.memory_lock: false
network.host: 0.0.0.0
http.port: 9200
discovery.zen.ping.unicast.hosts: ["192.168.137.177", "192.168.137.178", "192.168.137.179"]
discovery.zen.minimum_master_nodes: 2
http.cors.enabled: true
http.cors.allow-origin: "*"
#以下为设置密码，arm 架构不适用（7.12.0 验证可以）
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.keystore.path: elastic-certificates.p12
xpack.security.transport.ssl.truststore.path: elastic-certificates.p12
```

生成证书（两条命令都直接按 enter，最终生成两个文件）：

```bash
bin/elasticsearch-certutil ca
bin/elasticsearch-certutil cert --ca elastic-stack-ca.p12

mv elastic-stack-ca.p12 elastic-certificates.p12 config/目录
```

7.12.0 的生成证书方式不同：

```bash
cd config/
../bin/elasticsearch-certutil ca -out config/certs/elastic-certificates.p12
```

配置文件相应修改为：

```text
xpack.security.transport.ssl.keystore.path: certs/elastic-certificates.p12
xpack.security.transport.ssl.truststore.path: certs/elastic-certificates.p12
```

生成密码：

```bash
bin/elasticsearch-setup-passwords interactive
```

调整 JVM 堆内存，`vi jvm.options`：

```text
-Xms6g
-Xmx6g
```

## 六、安装 Kibana

```bash
cd /app/kafka/elk6.8.0/kibana-6.8.5-linux-x86_64/config
vi kibana.yml
```

调整以下参数：

```text
server.port: 5601
server.host: "192.168.137.177"
elasticsearch.hosts: ["http://192.168.137.177:9200", "http://192.168.137.178:9200", "http://192.168.137.179:9200"]
kibana.index: ".kibana"
i18n.locale: "zh-CN"
```

## 七、安装 Logstash

先调 JVM 参数，`vi jvm.options`：

```text
-Xms4g
-Xmx4g
```

再新建 `filebeat.conf` 配置文件，`vi filebeat.conf`，内容如下：

```text
input {
    kafka{
        bootstrap_servers => ["192.168.137.177:9092,192.168.137.178:9092,192.168.137.179:9092"]
        client_id => "pfpj-filebeats"
        auto_offset_reset => "latest"
        consumer_threads => 6
        decorate_events => true
        topics_pattern => "iocp-.*"
        codec => "json"
    }
}
filter {
   # pattern matching logback pattern
   grok {
      match => { "message" => "\[%{LOGLEVEL:level}\s*\]\[%{TIMESTAMP_ISO8601:[@metadata][timestamp]}\]\[%{DATA:thread}\]\[%{DATA:tid}\]\[%{DATA:trace}\]--\s*%{GREEDYDATA:rest}" }
   }
   date {
      match => ["[@metadata][timestamp]", "yyyy-MM-dd HH:mm:ss.SSS", "ISO8601" ]
      locale => "cn"
      timezone => "Asia/Shanghai"
    }
   mutate {
      remove_field => ["message","@version","host","input","log","prospector"]
   }
}
output {
    
    if "_frokparsefailure" not in [tags] and "_dateparsefailure" not in [tags] {
       #stdout{codec=>rubydebug}
       elasticsearch {
           hosts => ["192.168.137.180:9200","192.168.137.181:9200","192.168.137.182:9200"]
           index => "iocp-%{+YYYY-MM-dd}"
           document_type => "log"
		   codec => line {format => "%{rest}"}
       }
    }
}
```

## 八、拷贝软件到 178-179 服务器

```bash
cd /app/kafka
scp -r elk6.8.0/ data/ kafka@192.168.137.178:/app/kafka/elk6.8.0/
scp -r elk6.8.0/ data/ kafka@192.168.137.179:/app/kafka/elk6.8.0/
```

以下配置需要修改：

```bash
#zookeeper 配置
cd /app/kafka/data/zookeeper
#178 修改为：
echo "2" > myid

#179 修改为：
echo "3" > myid
```

```text
#kafka 配置：cd /app/kafka/elk6.8.0/kafka_2.11-2.4.0/config，vi server.properties
#178 修改为
broker.id=2
host.name=192.168.137.178
listeners=PLAINTEXT://192.168.137.178:9092
advertised.listeners=PLAINTEXT://192.168.137.178:9092

#179 修改为
broker.id=3
host.name=192.168.137.179
listeners=PLAINTEXT://192.168.137.179:9092
advertised.listeners=PLAINTEXT://192.168.137.179:9092
```

```text
#elasticsearch 配置：cd /app/kafka/elk6.8.0/elasticsearch-6.8.5/config，vi elasticsearch.yml
#178 修改为
node.name: node-2

#179 修改为
node.name: node-3
```

```text
#kibana 配置：cd /app/kafka/elk6.8.0/kibana-6.8.5-linux-x86_64/config，vi kibana.yml
#178 修改为
server.host: "192.168.137.178"

#179 修改为
server.host: "192.168.137.179"
```

## 九、拷贝 ES 和 Logstash 到 180-182 并改配置

```bash
cd /app/kafka/elk6.8.0
scp -r elasticsearch-6.8.5/ logstash-6.8.5/ elk@192.168.137.182:/app/elk/elk6.8.0/
```

修改 `192.168.137.180-182` 配置，路径均为 `/app/elk/elk6.8.0/elasticsearch-6.8.5/config`：

```text
#180 配置
node.name: node-4
node.master: false
node.data: true
path.data: /app/elk/data/elasticsearch/data
path.logs: /app/elk/data/elasticsearch/logs

#181 配置
node.name: node-5
node.master: false
node.data: true
path.data: /app/elk/data/elasticsearch/data
path.logs: /app/elk/data/elasticsearch/logs

#182 配置
node.name: node-6
node.master: false
node.data: true
path.data: /app/elk/data/elasticsearch/data
path.logs: /app/elk/data/elasticsearch/logs
```

## 十、启动服务

**177-179：**

```bash
#zookeeper 服务
#启动服务
cd /app/kafka/elk6.8.0/apache-zookeeper-3.5.7-bin
sh start.sh
#检测状态
sh status.sh
#停止服务
cd /app/kafka/elk6.8.0/apache-zookeeper-3.5.7-bin
sh stop.sh

#kafka 服务
cd /app/kafka/elk6.8.0/kafka_2.11-2.4.0
sh start.sh
sh stop.sh

#elasticsearch 服务
cd /app/kafka/elk6.8.0/elasticsearch-6.8.5
sh start.sh
sh stop.sh

#kibana 服务
cd /app/kafka/elk6.8.0/kibana-6.8.5-linux-x86_64
sh start.sh
sh stop.sh
```

**180-181：**

```bash
#elasticsearch 服务
cd /app/kafka/elk6.8.0/elasticsearch-6.8.5
sh start.sh
sh stop.sh

#logstash 服务
cd /app/elk/elk6.8.0/logstash-6.8.5
sh start.sh
sh stop.sh
```

## 十一、启停脚本

脚本放在各自组件目录下，统一的思路是先用 `ps -ef | grep` 抓进程号：`start.sh` 发现已有进程就直接退出，`stop.sh` 则 `kill -9` 掉它。

### Zookeeper

`apache-zookeeper-3.5.7-bin/start.sh`：

```bash
pid=`ps -ef| grep apache-zookeeper-3.5.7-bin | gawk '$0 !~/grep/ {print $2}' | tr -s '\n' ' '`

if test -n "$pid"
then
    echo "$pid exist. please kill first."
    exit
fi

cd /app/kafka/elk6.8.0/apache-zookeeper-3.5.7-bin/bin/
./zkServer.sh start
```

`apache-zookeeper-3.5.7-bin/stop.sh`：

```bash
#kill进程
pid=`ps -ef| grep apache-zookeeper-3.5.7-bin | gawk '$0 !~/grep/ {print $2}' | tr -s '\n' ' '`

if test -n "$pid"
then
    echo "kill -9 $pid"
    rc=`kill -9 $pid`
    exit
fi
echo "zookeeper not exist."
```

### Kafka

`kafka_2.11-2.4.0/start.sh`：

```bash
pid=`ps -ef| grep kafka_2.11-2.4.0 | gawk '$0 !~/grep/ {print $2}' | tr -s '\n' ' '`

if test -n "$pid"
then
    echo "$pid exist. please kill first."
    exit
fi
./bin/kafka-server-start.sh config/server.properties &
```

`kafka_2.11-2.4.0/stop.sh`：

```bash
#kill进程
pid=`ps -ef| grep kafka_2.11-2.4.0 | gawk '$0 !~/grep/ {print $2}' | tr -s '\n' ' '`

if test -n "$pid"
then
    echo "kill -9 $pid"
    rc=`kill -9 $pid`
    exit
fi
echo "kafka not exist."
```

### Elasticsearch

`elasticsearch-6.8.5/start.sh`：

```bash
pid=`ps -ef| grep elasticsearch-6.8.5 | gawk '$0 !~/grep/ {print $2}' | tr -s '\n' ' '`

if test -n "$pid"
then
    echo "$pid exist. please kill first."
    exit
fi
./bin/elasticsearch -d
```

`elasticsearch-6.8.5/stop.sh`：

```bash
#kill进程
pid=`ps -ef| grep elasticsearch-6.8.5 | gawk '$0 !~/grep/ {print $2}' | tr -s '\n' ' '`

if test -n "$pid"
then
    echo "kill -9 $pid"
    rc=`kill -9 $pid`
    exit
fi
echo "elasticsearch not exist."
```

### Kibana

`kibana-6.8.5-linux-x86_64/start.sh`：

```bash
pid=`ps -ef| grep kibana-6.8.5-linux-x86_64 | gawk '$0 !~/grep/ {print $2}' | tr -s '\n' ' '`

if test -n "$pid"
then
    echo "$pid exist. please kill first."
    exit
fi
./bin/kibana &
```

`kibana-6.8.5-linux-x86_64/stop.sh`：

```bash
#kill进程
pid=`ps -ef| grep kibana-6.8.5-linux-x86_64 | gawk '$0 !~/grep/ {print $2}' | tr -s '\n' ' '`

if test -n "$pid"
then
    echo "kill -9 $pid"
    rc=`kill -9 $pid`
    exit
fi
echo "kibana not exist."
```

### Logstash

`logstash-6.8.5/start.sh`：

```bash
pid=`ps -ef| grep logstash-6.8.5 | gawk '$0 !~/grep/ {print $2}' | tr -s '\n' ' '`

if test -n "$pid"
then
    echo "$pid exist. please kill first."
    exit
fi
./bin/logstash -f config/filebeat.conf &
```

`logstash-6.8.5/stop.sh`：

```bash
#kill进程
pid=`ps -ef| grep logstash-6.8.5 | gawk '$0 !~/grep/ {print $2}' | tr -s '\n' ' '`

if test -n "$pid"
then
    echo "kill -9 $pid"
    rc=`kill -9 $pid`
    exit
fi
echo "logstash not exist."
```

## 十二、ARM 架构安装问题

在 ARM 机器上跑这套组件时遇到的两个报错：

**logstash 报错：**

```text
(LoadError) load error: ffi/ffi -- java.lang.NullPointerException: null
```

参考：<https://blog.csdn.net/qq_32639315/article/details/103434056>

**elasticsearch 报错：** 修改配置文件 `/etc/elasticsearch/elasticsearch.yml` 添加

```text
xpack.ml.enabled: false
```

X-Pack 只支持 x86_64，需要禁用，否则运行 es 会报错。
