//로그인 상태 확인 미들웨어
exports.isLoggedIn = (req, res, next) => {
   if (req.isAuthenticated()) {
      //로그인 되었으면 다음 미들웨어로 이동
      next()
   } else {
      //로그인 되지 않은 경우
      res.status(403).json({
         success: false,
         message: '로그인이 필요합니다.',
      })
   }
}

//비로그인 상태 확인 미들웨어
exports.isNotLoggedIn = (req, res, next) => {
   //사용자가 로그인 안된 상태인지 확인
   //로그인 안됐을 때는 isAuthenticated() = false 값 반환
   if (!req.isAuthenticated()) {
      //로그인 되지 않은 경우 다음 미들웨어로 이동
      next()
   } else {
      //로그인 된 경우
      res.status(400).json({
         success: false,
         message: '이미 로그인된 상태입니다.',
      })
   }
}

//관리자 권한 확인 미들웨어
