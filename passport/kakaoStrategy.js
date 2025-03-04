const passport = require('passport')
const KakaoStrategy = require('passport-kakao').Strategy
const User = require('../models/user')
const UserAccount = require('../models/userAccount')

module.exports = () => {
   passport.use(
      new KakaoStrategy(
         {
            clientID: process.env.KAKAO_ID, // 카카오 로그인에서 발급받은 REST API 키
            callbackURL: '/auth/kakao/callback', // 카카오 로그인 Redirect URI 경로
         },

         async (accessToken, refreshToken, profile, done) => {
            console.log('kakao profile', profile)
            try {
               const exUserAccount = await UserAccount.findOne({
                  // 카카오 플랫폼에서 로그인 했고 & profileId필드에 카카오 아이디가 일치할경우
                  where: { profileId: profile.id, accountType: 'KAKAO' },
               })
               // 이미 가입된 카카오 프로필이면 User에서 이 useraccount 가진사람 찾기
               if (exUserAccount) {
                  //exUserAccount가 있다는건 해당되는 User객체도 있다는 뜻
                  const exUser = await User.findOne({
                     where: { id: exUserAccount.userId },
                  })
                  done(null, exUser) // 로그인 인증 완료
               } else {
                  // 가입되지 않는 유저면 회원가입을 시키기 위해 임의의데이터를 구성
                  const tempUserAccount = {
                     profileId: profile.id,
                     accountEmail: profile._json.kakao_account.email,
                     accountType: 'KAKAO',
                  }
                  const tempUser = {
                     email: profile._json.kakao_account.email,
                     name: profile.username,
                  }

                  done(null, false, {
                     message: '가입되지 않은 회원입니다.',
                     tempThings: { tempUserAccount, tempUser },
                     redirect: 'http://localhost:3000/additionalsignup',
                  })
               }
            } catch (error) {
               console.error(error)
               done(error)
            }
         }
      )
   )
}
