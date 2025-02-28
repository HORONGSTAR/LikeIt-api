const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/user')
const UserAccount = require('../models/userAccount')

// Google OAuth Strategy
module.exports = () => {
   passport.use(
      new GoogleStrategy(
         {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
         },
         async (accessToken, refreshToken, profile, done) => {
            // Handle user profile here (e.g., save to database)
            console.log('google profile : ', profile)
            console.log('엑세스토큰:', accessToken)
            try {
               const exUserAccount = await UserAccount.findOne({
                  // 구글 플랫폼에서 로그인 했고 & profileId필드에 구글 아이디가 일치할경우
                  where: { profileId: profile.id, accountType: 'GOOGLE' },
               })
               // User 객체에서 find해서
               // 이미 가입된 구글 프로필이면 성공
               if (exUserAccount) {
                  const exUser = await User.findOne({
                     where: { id: exUserAccount.userId },
                  })
                  done(null, exUser) // 로그인 인증 완료
               } else {
                  // 가입되지 않는 유저면
                  const tempUserAccount = {
                     profileId: profile.id,
                     accountEmail: profile?.emails[0].value,
                     accountType: 'GOOGLE',
                  }
                  const tempUser = {
                     email: profile?.emails[0].value, //이게 뭐지??
                     name: profile.displayName,
                  }

                  done(null, false, {
                     message: '가입되지 않은 회원입니다.',
                     tempThings: { tempUserAccount, tempUser },
                     redirect: 'http://localhost:3000/additionalsignup',
                  }) // 회원가입하고 로그인 인증 완료
               }
            } catch (error) {
               console.error(error)
               done(error)
            }
         }
      )
   )
}
