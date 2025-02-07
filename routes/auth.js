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
    const exNicknameUser = await User.findOne({ where: { name: nickname } })
    if (exNicknameUser) {
      return res.status(409).json({
        success: false,
        message: '동일한 닉네임으로 가입한 사용자가 있습니다.',
      })
    }

    const hash = await bcrypt.hash(password, 12)
    const newUser = await User.create({
      email: email,
      phone: phone,
      name: nickname,
      password: hash,
      role: 'USER',
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

//로그인 localhost:8000/auth/login
router.post('/login', isNotLoggedIn, async (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      //로그인 인증 중 에러 발생시
      return res.status(500).json({
        success: false,
        message: '인증 중 오류 발생',
        error: authError,
      })
    }
    if (!user) {
      //비밀번호 불일치 또는 사용자가 없을 경우 info.message를 사용해서 메세지 전달
      return res.status(401).json({
        success: false,
        message: info.message || '로그인 실패',
      })
    }

    //인증이 정상적으로 되고 사용자를 로그인 상태로 바꿈
    req.login(user, (loginError) => {
      if (loginError) {
        //로그인 상태로 바꾸는 중 오류 발생시
        return res.status(500).json({
          success: false,
          message: '로그인 중 오류 발생',
          error: loginError,
        })
      }
      //로그인 성공시
      //status code를 주지 않으면 기본값은 200
      res.json({
        success: true,
        message: '로그인 성공',
        user: {
          id: user.id,
          name: user.name,
        },
      })
    })
  })
})

//로그아웃 localhost:8000/auth/logout
router.get('/logout', isLoggedIn, async (req, res, next) => {
  //사용자를 로그아웃 상태로 바꿈
  req.logout((err) => {
    if (err) {
      //로그아웃 상태로 바꾸는 중 에러가 났을 때
      console.log(err)
      return res.status(500).json({
        success: false,
        message: '로그아웃 중 오류가 발생했습니다.',
        error: err,
      })
    }
    //로그아웃 성공시 세션에 저장되어 있던 사용자 id를 삭제해주고 아래와 같은 결과를 response
    //status code를 주지 않으면 기본값은 200
    res.json({
      success: true,
      message: '로그아웃에 성공했습니다.',
    })
  })
})

module.exports = router
