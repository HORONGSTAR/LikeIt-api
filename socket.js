const { Server } = require('socket.io')
const passport = require('passport')

module.exports = (server, sessionMiddleware) => {
   // Socket.IO 서버 생성
   const io = new Server(server, {
      cors: {
         origin: process.env.FRONTEND_APP_URL,
         methods: ['GET', 'POST'],
         credentials: true,
      },
   })

   io.use((socket, next) => {
      sessionMiddleware(socket.request, {}, next)
   })

   io.use((socket, next) => {
      if (socket.request.session?.passport?.user) {
         passport.deserializeUser(socket.request.session.passport.user, (err, user) => {
            if (err) return next(err)
            socket.request.user = user
            next()
         })
      } else {
         console.log('비인증 사용자 연결 시도')
         return socket.disconnect()
      }
   })

   io.on('connection', (socket) => {
      const user = socket.request.user
      console.log('사용자 연결됨: ', user?.id)

      const spaceRoom = {}

      socket.on('start space', (data) => {
         const { adminId, studioId } = data
         console.log('스페이스 시작', adminId, studioId)
      })

      socket.on('disconnect', () => {
         console.log('사용자 연결 해제:', user?.id)
         return socket.disconnect()
      })
   })

   return io
}
