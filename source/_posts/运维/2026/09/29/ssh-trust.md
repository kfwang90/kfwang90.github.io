---
title: Ansible 实战：常用命令速查与 ssh_trust.sh 主机互信脚本分享
date: 2026-09-29 09:30:00
tags:
  - Ansible
  - Linux
  - DevOps
description: 整理批量拷贝、批量安装、批量分发配置等常用 ad-hoc 命令，并分享一个基于 expect 的 SSH 免密互信脚本。
---

这篇笔记汇总日常批量运维中最常用的 Ansible 临时命令（ad-hoc），并分享一个基于 `expect` 的 SSH 互信脚本 `ssh_trust.sh`，用来在两台主机之间快速建立免密登录。

## 一、Ansible 常用命令

命令说明：`-i` 指定 inventory 文件，`db` / `db2` 为 inventory 中的主机组，`-m` 指定模块，`-a` 传入模块参数，`-u` 指定远端执行用户。

```bash
#ansible命令使用
#批量拷贝
ansible -i node_accountdb db -m copy -a "src=./.bash_profile dest=/home/postgresql group=postgresql owner=postgresql mode=744"

#批量安装
ansible -i /root/scripts/node_accountdb db -m shell -u root -a "yum install -y pcs"
ansible -i /root/scripts/node_accountdb db -m shell -a "yum install -y expect"
ansible -i /root/scripts/node_accountdb db -m shell -a "systemctl enable pcsd.service"
ansible -i /root/scripts/node_accountdb db -m shell -a "systemctl start pcsd.service"
ansible -i /root/scripts/node_accountdb db -m shell -a "echo hacluster | passwd hacluster --stdin"

#批量分发配置文件
ansible -i node_accountdb db -m copy -a "src=./.bash_profile dest=/root"
ansible -i node_accountdb db -m shell -a "source /root/.bash_profile"
ansible -i node_accountdb db -m shell -a "mkdir -p /dbbak/pgsql/archive"

#批量写入 hosts
ansible -i node_accountdb db2 -m shell -a "echo -e '192.168.137.100 accountdb8m\n192.168.137.101 accountdb8s\n192.168.137.102 accountdb8a' >> /etc/hosts"

#批量执行远端脚本
ansible -i node db -m shell -a "sh segments.sh"
```

> 常用模块：`copy` 负责文件分发（`src` / `dest` / `owner` / `group` / `mode`）；`shell` 在远端执行命令，适合安装软件包、启停服务、批量改写配置等场景。

## 二、ssh_trust.sh 主机互信脚本

脚本用 `expect` 自动应答密码提示，共三步：在远程主机 1 上生成密钥对、把主机 1 的公钥取回本地、再把公钥追加到远程主机 2 的 `authorized_keys`。

```bash
#!/bin/bash

if [ "$#" -ne 6 ]
then 
echo "useAge: ./$0 host1 user1 passwd1 host2 user2 passwd2"
exit
fi

src_host=$1
src_username=$2
src_passwd=$3

dst_host=$4
dst_username=$5
dst_passwd=$6

#在远程主机1上生成公私钥对
Keygen()
{
expect << EOF

spawn ssh $src_username@$src_host ssh-keygen -t rsa
while 1 {

        expect {
                        "password:" {
                                        send "$src_passwd\n"
                        }
                        "yes/no*" {
                                        send "yes\n"
                        }
                        "Enter file in which to save the key*" {
                                        send "\n"
                        }
                        "Enter passphrase*" {
                                        send "\n"
                        }
                        "Enter same passphrase again:" {
                                        send "\n"
                                        }

                        "Overwrite (y/n)" {
                                        send "n\n"
                        }
                        eof {
                                   exit
                        }

        }
}
EOF
}

#从远程主机1获取公钥保存到本地
Get_pub()
{
expect << EOF

spawn scp $src_username@$src_host:~/.ssh/id_rsa.pub /tmp
expect {
             "password:" {
                            send "$src_passwd\n";exp_continue
                }
                "yes/no*" {
                            send "yes\n";exp_continue
                }
                eof {
                                exit
                }
}
EOF
}

#将公钥的内容附加到远程主机2的authorized_keys
Put_pub()
{
src_pub="$(cat /tmp/id_rsa.pub)"
expect << EOF
spawn ssh $dst_username@$dst_host "chmod 700 ~/.ssh;echo $src_pub >> ~/.ssh/authorized_keys;chmod 600 ~/.ssh/authorized_keys"
expect {
            "password:" {
                        send "$dst_passwd\n";exp_continue
             }
            "yes/no*" {
                        send "yes\n";exp_continue
             }
            eof {
                        exit
             }
}
EOF
}
Keygen
Get_pub
Put_pub
```

> 用法：`./ssh_trust.sh host1 user1 passwd1 host2 user2 passwd2`。执行完成后即可从主机 1 免密登录主机 2；脚本依赖远端已安装 `expect` 与 `ssh-keygen`。

## 三、小结

批量操作优先交给 Ansible 的 `copy` 与 `shell` 模块，跨主机免密则用 `ssh_trust.sh` 一步搞定，日常运维里能省下大量重复劳动。
