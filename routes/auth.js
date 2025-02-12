const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcrypt')
const { isLoggedIn, isNotLoggedIn } = require('./middlewares')
const User = require('../models/user')
const UserAccount = require('../models/userAccount')
const nodemailer = require('nodemailer')

//일반회원가입 localhost:8000/auth/join
router.post('/join', isNotLoggedIn, async (req, res, next) => {
   const { email, phone, nickname, password } = req.body
   //이메일 중복 확인
   try {
      if (!email || !phone || !nickname || !password) {
         return res.status(404).json({
            success: false,
            message: '모든 입력란을 입력해주세요.',
         })
      }
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

//일반로그인 localhost:8000/auth/login
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
               role: user.role,
            },
         })
      })
   })(req, res, next)
})

//구글로그인 연동 시작버튼
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

//구글 최종 로그인
router.get('/google/callback', isNotLoggedIn, (req, res, next) => {
   passport.authenticate(
      'google',
      // { failureRedirect: '/' }, //원래는 이거였음 아랫걸로 바꿔줌
      { failureRedirect: process.env.FRONTEND_APP_URL },
      (authError, user, info) => {
         if (authError) {
            //로그인 인증 중 에러 발생시
            return res.status(500).json({
               success: false,
               message: '인증 중 오류 발생',
               error: authError,
            })
         }
         if (!user) {
            req.session.tempThings = info.tempThings
            return res.redirect(info.redirect) // Redirect to additional info page
         }
         req.login(user, (loginError) => {
            if (loginError) {
               // 로그인 상태로 바꾸는 중 오류 발생시
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
                  nick: user.nick,
               },
            })
         })
      }
   )(req, res, next)
})

//구글 어카운트가 없을경우의 user랑 account 모두 생성
//전화번호를 확인하고 commonsignup만 돼있는 회원인지 아니면 googlelogin으로도 되어있는 회원인지에 따라서 코드가 달라져야 함.
router.post('/googlejoin', isNotLoggedIn, async (req, res, next) => {
   const { phone } = req.body
   try {
      const exUser = await User.findOne({
         where: {
            phone: phone,
         },
      })
      if (exUser) {
         return res.status(409).json({
            success: false,
            message: '동일한 전화번호로 중복가입은 불가능합니다.',
         })
      }
      //동일한 전화번호로 가입한 사람이 없다면 newUser, newUserAccount 생성

      // console.log(req.session)
      // console.log('어카운트이메일:', req.session.tempThings.tempUserAccount.accountEmail)

      const newUserAccount = await UserAccount.create({
         accountEmail: req.session.tempThings.tempUserAccount.accountEmail,
         profileId: req.session.tempThings.tempUserAccount.profileId,
         accountType: req.session.tempThings.tempUserAccount.accountType,
      })
      const newUser = await User.create({
         email: req.session.tempThings.tempUser.email,
         name: req.session.tempThings.tempUser.name,
         phone: phone,
         role: 'USER',
      })

      res.status(201).json({
         success: true,
         message: '사용자(구글연동)가 성공적으로 등록되었습니다.',
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

//로그인 상태 확인 localhost:8000/auth/status
router.get('/status', async (req, res, next) => {
   if (req.isAuthenticated()) {
      res.json({
         isAuthenticated: true,
         user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
         },
      })
   } else {
      res.json({
         isAuthenticated: false,
      })
   }
})

//이메일 발송 localhost:8000/auth/status
router.post('/sendpassword', async (req, res, next) => {
   const { email_service, user, pass } = process.env

   const transporter = nodemailer.createTransport({
      service: email_service,
      auth: {
         user: user,
         pass: pass,
      },
   })

   const mailOptions = {
      from: user,
      to: '@',
      subject: 'Nodemailer Test',
      text: '노드 패키지 nodemailer를 이용해 보낸 이메일임',
   }
})

module.exports = router
