const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcrypt')
const { isLoggedIn, isNotLoggedIn } = require('./middlewares')
const User = require('../models/user')

//일반회원가입 localhost:8000/auth/join
router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { email, phone, nickname, password } = req.body
  //이메일 중복 확인
  try {
    const exEmailUser = await User.findOne({ where: { email } })
    if (exEmailUser) {
      return res.status(409).json({
        success: false,
        message: '동일한 이메일로 가입한 사용자가 있습니다.',
      })
    }
    //폰번호 중복 확인
    const exPhoneUser = await User.findOne({ where: { phone } })
    if (exPhoneUser) {
      return res.status(409).json({
        success: false,
        message: '동일한 전화번호로 가입한 사용자가 있습니다.',
      })
    }

    //이름 중복 확인
    const exNicknameUser = await User.findOne({ where: { nickname } })
    if (exNicknameUser) {
      return res.status(409).json({
        success: false,
        message: '동일한 이름으로 가입한 사용자가 있습니다.',
      })
    }

    const hash = await bcrypt.hash(password, 12)
    const newUser = await User.create({
      email: email,
      phone: phone,
      name: nickname,
      password: hash,
    })
    // 위 코드 findOrCreate하면 줄일수 있는지 여쭤보고 성능에도 영향 미치는지 여쭤보기.

    res.status(201).json({
      success: true,
      message: '사용자가 성공적으로 등록되었습니다.',
      newUser,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '회원가입중 오류가 발생했습니다.',
      error,
    })
  }
})

module.exports = router
