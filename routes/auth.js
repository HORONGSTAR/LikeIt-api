const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcrypt')
const { isLoggedIn, isNotLoggedIn } = require('./middlewares')
const User = require('../models/user')
const UserAccount = require('../models/userAccount')
const nodemailer = require('nodemailer')
const { sequelize } = require('../models')
const { promisify } = require('util')

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

// 구글로그인 연동 시작버튼
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

//이메일로 임시비밀번호 보내기
router.post('/setpassword', async (req, res, next) => {
   const transaction = await sequelize.transaction()

   try {
      const { email } = req.body

      const correspondingUser = await User.findOne({
         where: {
            email: email,
         },
      })

      if (!correspondingUser) {
         //사용자가 없을 경우 info.message를 사용해서 메세지 전달
         return res.status(401).json({
            success: false,
            message: info.message || '해당 이메일의 회원이 없습니다.',
         })
      }

      const { email_service, user, pass, host, email_port } = process.env

      const transporter = nodemailer.createTransport({
         service: email_service,
         host: host,
         port: email_port,
         auth: {
            user: user,
            pass: pass,
         },
         debug: true,
      })

      const sendMailAsync = promisify(transporter.sendMail.bind(transporter))

      const generateTempPassword = () => {
         const minLength = 8
         const maxLength = 20
         const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength // Random length between 8 and 20

         const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
         const lower = 'abcdefghijklmnopqrstuvwxyz'
         const digits = '0123456789'
         const special = '!@#$%^&*()-_=+[]{}|;:\'",.<>?/'

         const allChars = upper + lower + digits + special

         // Ensure at least one of each category
         let password = [upper[Math.floor(Math.random() * upper.length)], lower[Math.floor(Math.random() * lower.length)], digits[Math.floor(Math.random() * digits.length)], special[Math.floor(Math.random() * special.length)]]

         // Fill the remaining length
         for (let i = password.length; i < length; i++) {
            password.push(allChars[Math.floor(Math.random() * allChars.length)])
         }

         // Shuffle the password to ensure randomness
         password = password.sort(() => Math.random() - 0.5)

         return password.join('')
      }

      const tempPassword = generateTempPassword()

      const hash = await bcrypt.hash(tempPassword, 12)

      //변경된 비번 데이터베이스에도 수정
      correspondingUser.password = hash

      await correspondingUser.save({ transaction })

      const mailOptions = {
         from: 'psb6396@naver.com',
         to: email,
         subject: '임시 비밀번호',
         text: `임시 비밀번호는 ${tempPassword} 입니다.`,
      }

      await sendMailAsync(mailOptions)

      await transaction.commit()
      // console.log('근데 문제는 이 메세지가 뜨면 안됨 뜨면 망함 ㅇㅇ')
      res.status(200).json({ success: true, message: '임시 비밀번호가 이메일로 전송되었습니다.' })
   } catch (error) {
      await transaction.rollback()
      console.error(error)
      res.status(500).json({ success: false, message: '임시비밀번호를 보내는 중 오류가 발생했습니다.', error })
   }
})

//이메일 변경
router.put('/changeemail', async (req, res, next) => {
   const user = await User.findOne({ where: { id: req.user.id } })

   const { email } = req.body

   await user.update({
      email: email, //수정된 이메일
   })

   res.json({
      success: true,
      user: user,
      message: '이메일이 성공적으로 수정되었습니다.',
   })
})

//비밀번호 변경
router.put('/changepassword', async (req, res, next) => {
   async function isCurrentPasswordCorrect(plainPassword, hashedPassword) {
      try {
         const match = await bcrypt.compare(plainPassword, hashedPassword)
         return match // true if passwords match, false otherwise
      } catch (error) {
         console.error('현재 비밀번호 비교중 에러:', error)
         return false
      }
   }
   try {
      const user = await User.findOne({ where: { id: req.user.id } })

      const { currentPassword, passwordToChange } = req.body

      const isCorrect = await isCurrentPasswordCorrect(currentPassword, user.password)

      if (!isCorrect) {
         return res.status(404).json({
            success: false,
            message: '현재비밀번호가 일치하지 않거나 오류가 발생했습니다',
         })
      }

      const newHash = await bcrypt.hash(passwordToChange, 12)

      await user.update({
         password: newHash,
      })

      res.json({
         success: true,
         user: user,
         message: '비밀번호가 성공적으로 수정되었습니다.',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '비밀번호를 수정하는 중 오류가 발생했습니다.', error })
   }
})

module.exports = router
