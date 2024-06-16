# ERstat.kr

2022년 10월 약 3주동안 서비스했던 erstat 프로젝트입니다.

이터널 리턴의 공개 API를 활용하여 게임 데이터(수백만건 이상)들을 수집하고 통계 및 표본을 제공했었습니다.

Node.Js, Express, MySQL 을 사용하여 구현했으며 구글 GCP를 사용해 배포했습니다.

제작한 사이트를 유저 커뮤니티에 공개하며 피드백을 받아 서비스 했었습니다.

API 초당 횟수 제한을 우회하기 위해 여러 개의 키를 정해진 시간 단위로 스왑하는 라운드 로빈 기법을 사용했었습니다. 

또한 실시간에 가까운 데이터 수집을 위해 많은 고민(유저 데이터로 갱신, 최신 게임ID 탐색 방법 개선)을 했었으나, 결국 적용하지 못한 점은 프로젝트를 진행하며 아쉬운 점으로 남았습니다.

당시 유저 전적 및 통계를 제공하던 DAK.GG 에서 10일치 통계를 제공하기 시작하면서 짧은 서비스를 종료하게 됐습니다.


* * *
<p align="center">
  <img src="https://github.com/ms9849/erstat_legacy/assets/65911657/a61cd99c-585d-456c-a376-2a163804ee7e">   
  <br/>
  <메인 페이지>
</p>

* * *

<p align="center">
  <img src="https://github.com/ms9849/erstat_legacy/assets/65911657/64af1b55-461b-4fff-8375-52f7f704feae">  
  <br/>
  <통계 1>
</p>

* * *

<p align="center">
  <img src="https://github.com/ms9849/erstat_legacy/assets/65911657/de59c3b2-4125-4c80-ae6d-6481c63c1889">   
  <br/>
  <통계 2>
</p>

* * *

<p align="center">
  <img src="https://github.com/ms9849/erstat_legacy/assets/65911657/5fbf6d40-9938-4a35-a5a5-92959b929425">   
  <br/>
  <통계 3>
</p>

* * *



