const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcrypt')
const { isLoggedIn, isNotLoggedIn } = require('./middlewares')
const User = require('../models/user')

//일반회원가입 localhost:8000/auth/join
router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { email, phone, nick, password } = req.body
  //이메일중복확인
  try {
    const exEmailUser = await User.findOne({ where: { email } })
    if (exEmailUser) {
      return res.status(409).json({
        success: false,
        message: '동일한 이메일로 가입한 사용자가 있습니다.',
      })
    }
    const exPhoneUser = await User.findOne({ where: { phone } })
    if (exPhoneUser) {
      return res.status(409).json({
        success: false,
        message: '동일한 전화번호로 가입한 사용자가 있습니다.',
      })
    }
  } catch (error) {}
})

module.exports = router
