const express = require('express')
const router = express.Router()
const { isLoggedIn } = require('./middlewares')

//프로필 조회 localhost:8000/page/profile
router.get('/profile', isLoggedIn, async (req, res) => {
   res.json({
      success: true,
      user: req.user,
      message: '프로필 정보를 성공적으로 가져왔습니다.',
   })
})

module.exports = router
