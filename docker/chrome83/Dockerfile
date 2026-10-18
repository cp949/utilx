# Chrome 83 실행 검증용 이미지. Debian snapshot.debian.org에 고정된
# chromium=83.0.4103.116-3(2020-07-12 sid snapshot)과 Node.js를 같이 둔다.
# 호스트에서 이 바이너리를 직접 실행하려면 공유 라이브러리를 통째로 추출해야 해서 컨테이너를 쓴다.
#
# 공식 Chrome 하한은 75다(baseline.json). 이 이미지가 83인 이유는 Playwright가 page/context 생성 시
# 호출하는 CDP `Browser.setDownloadBehavior`가 Chrome 82부터 있어서 75·76에서는 Playwright를 실행할 수
# 없기 때문이다. Debian 스냅샷에 82.x가 없어 83.x가 실행 가능한 가장 낮은 후보다.
# 이 이미지의 결과를 Chrome 75 통과로 표기하지 않는다.
FROM debian:buster-slim

ARG NODE_VERSION=24.20.0
# nodejs.org의 SHASUMS256.txt 값. NODE_VERSION을 바꾸면 함께 바꾼다.
ARG NODE_SHA256=2f2c0da162318f0de47665410c7c8c2ed3d36c8f3105de4bbc61176c70a7cbf2

RUN set -eux; \
    # 같은 버전의 더 이른 리비전(-1)은 그 스냅샷 시점에 libavformat58 의존성이 깨져 있어 -3을 쓴다.
    # 서명은 이미지의 debian-archive-keyring으로 검증한다. 만료된 Valid-Until만 허용하고 trusted=yes는 쓰지 않는다.
    echo "deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20200712T145349Z unstable main" > /etc/apt/sources.list; \
    printf 'Acquire::Check-Valid-Until "false";\nAcquire::Retries "5";\n' > /etc/apt/apt.conf.d/99snapshot; \
    apt-get update; \
    # dbus-x11을 먼저 설치해 default-dbus-session-bus의 provider를 systemd 체인(이 스냅샷에 없음)이
    # 아니라 dbus-x11로 고정한다. 순서를 바꾸면 libgtk-3-0 설치가 막힌다.
    apt-get install -y --no-install-recommends dbus-x11; \
    apt-get install -y --no-install-recommends chromium=83.0.4103.116-3; \
    apt-get install -y --no-install-recommends curl ca-certificates xz-utils; \
    curl -fsSL -o /tmp/node.tar.xz "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz"; \
    echo "${NODE_SHA256}  /tmp/node.tar.xz" | sha256sum -c -; \
    mkdir -p /usr/local/lib/nodejs; \
    tar -xJf /tmp/node.tar.xz -C /usr/local/lib/nodejs; \
    rm /tmp/node.tar.xz; \
    rm -rf /var/lib/apt/lists/*

# 로케일이 없으면 Chrome 83이 한글 파일명을 저장하지 못하고 `download`로 바꾼다.
ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
ENV PATH="/usr/local/lib/nodejs/node-v${NODE_VERSION}-linux-x64/bin:${PATH}"
WORKDIR /repo
