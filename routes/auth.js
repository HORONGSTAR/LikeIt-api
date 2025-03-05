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

   try {
      if (!email || !phone || !nickname || !password) {
         return res.status(404).json({
            success: false,
            message: '모든 입력란을 입력해주세요.',
         })
      }
      const hash = await bcrypt.hash(password, 12)

      //폰번호 중복 확인
      const exPhoneUser = await User.findOne({ where: { phone } })

      let newUser

      if (exPhoneUser) {
         if (exPhoneUser.password) {
            return res.status(409).json({
               success: false,
               message: '중복가입할 수 없습니다.',
            })
         } else {
            //user정보 update
            newUser = await exPhoneUser.update({
               email: email,
               name: nickname,
               password: hash,
            })
         }
      } else {
         const exEmailUser = await User.findOne({ where: { email } })
         if (exEmailUser) {
            return res.status(409).json({
               success: false,
               message: '동일한 이메일로 가입한 사용자가 있습니다.',
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

         newUser = await User.create({
            email: email,
            phone: phone,
            name: nickname,
            password: hash,
            role: 'USER',
         })
      }

      res.json({
         success: true,
         message: '사용자가 성공적으로 등록되었습니다.',
         isSignupComplete: true,
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
               point: req.user.point,
               imgUrl: user.imgUrl,
               creatorId: user.Creator?.id,
               studioId: req.user.Creator?.StudioCreators[0]?.studioId,
            },
         })
      })
   })(req, res, next)
})

// 구글 연동 시작버튼
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

//구글 연동 인증 과정
router.get('/google/callback', isNotLoggedIn, (req, res, next) => {
   passport.authenticate('google', { failureRedirect: process.env.FRONTEND_APP_URL }, (authError, user, info) => {
      if (authError) {
         // 인증 중 에러 발생시

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

         res.redirect(`${process.env.FRONTEND_APP_URL}`)
      })
   })(req, res, next)
})

//카카오 연동 시작 버튼
router.get('/kakao', passport.authenticate('kakao'))

//카카오 연동 인증 과정
router.get('/kakao/callback', isNotLoggedIn, (req, res, next) => {
   passport.authenticate('kakao', { failureRedirect: process.env.FRONTEND_APP_URL }, (authError, user, info) => {
      if (authError) {
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

         res.redirect(`${process.env.FRONTEND_APP_URL}`)
      })
   })(req, res, next)
})

router.post('/snsjoin', isNotLoggedIn, async (req, res, next) => {
   try {
      const { phone } = req.body
      const exUser = await User.findOne({
         where: {
            phone: phone,
         },
      })

      if (exUser) {
         //exUserAccount는 없고 exUser는 있는 상태
         await UserAccount.create({
            accountEmail: req.session.tempThings.tempUserAccount.accountEmail,
            profileId: req.session.tempThings.tempUserAccount.profileId,
            accountType: req.session.tempThings.tempUserAccount.accountType,
            userId: exUser.id,
         })
      } else {
         const newUser = await User.create({
            email: req.session.tempThings.tempUserAccount.accountEmail,
            name: req.session.tempThings.tempUser.name,
            phone: phone,
            role: 'USER',
         })
         await UserAccount.create({
            accountEmail: req.session.tempThings.tempUserAccount.accountEmail,
            profileId: req.session.tempThings.tempUserAccount.profileId,
            accountType: req.session.tempThings.tempUserAccount.accountType,
            userId: newUser.id,
         })
      }

      res.status(201).json({
         success: true,
         isSignupComplete: true,
         message: '사용자(소셜계정연동)가 성공적으로 등록되었습니다.',
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
            point: req.user.point,
            imgUrl: req.user.imgUrl || '/default_profile.png',
            creatorId: req.user.Creator?.id,
            studioId: req.user.Creator?.StudioCreators[0]?.studioId,
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
            message: '해당 이메일의 회원이 없습니다.',
         })
      }

      if (!correspondingUser.password) {
         return res.status(401).json({
            success: false,
            message: '해당 이메일의 회원이 없습니다.',
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
      res.status(200).json({ success: true, message: '임시 비밀번호가 이메일로 전송되었습니다.' })
   } catch (error) {
      await transaction.rollback()
      console.error(error)
      res.status(500).json({ success: false, message: '임시비밀번호를 보내는 중 오류가 발생했습니다.', error })
   }
})

//이메일 가져오기
router.post('/email', async (req, res) => {
   try {
      const user = await User.findOne({ where: { phone: req.body.trimmedPhone } })
      res.json({
         success: true,
         email: user.email,
         message: '이메일을 성공적으로 불러왔습니다.',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '가입한 이메일을 불러오는 중 오류가 발생했습니다.', error })
   }
})

//이메일 변경
router.put('/changeemail', isLoggedIn, async (req, res, next) => {
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
router.put('/changepassword', isLoggedIn, async (req, res, next) => {
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

      if (!user.password) {
         return res.status(404).json({
            success: false,
            message: '소셜로그인한 회원은 비밀번호 변경이 불가능합니다.',
         })
      }

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
