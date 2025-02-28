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

   const spaceRoom = {}
   const today = new Date()

   io.on('connection', (socket) => {
      const user = socket.request.user
      const rooms = io.sockets.adapter.rooms

      console.log('사용자 연결됨: ', user?.id)

      socket.on('start space', (studioId) => {
         if (!spaceRoom[studioId]) {
            spaceRoom[studioId] = {
               admin: { name: user?.name, imgUrl: user?.imgUrl, startTime: today },
               watchers: [],
            }
            console.log(studioId, '번 스튜디오 스페이스 시작')
         } else {
            console.log(studioId, '번 스튜디오에서 이미 스페이스를 진행하고 있습니다.')
         }
      })

      socket.on('join space', (studioId) => {
         if (spaceRoom[studioId]) {
            socket.join(studioId)
            spaceRoom[studioId].watchers.push(user?.id)
            socket.emit('space info', spaceRoom[studioId])
            console.log(studioId, '번 스튜디오 스페이스에 참여합니다.')
         } else {
            console.log('참여할 수 있는 스페이스가 없습니다.')
         }
      })

      socket.on('chat message', (studioId, msg) => {
         if (studioId && msg) {
            io.to(studioId).emit('chat message', { name: user?.name, message: msg, imgUrl: user?.imgUrl })
         } else {
            console.log('메세지를 확인할 수 없습니다.')
         }
      })

      socket.on('leave space', (studioId) => {
         socket.leave(studioId)
         if (spaceRoom[studioId]) {
            spaceRoom[studioId].users = spaceRoom[studioId].watchers.filter((watcher) => watcher !== user.id)
            if (spaceRoom[studioId].watchers.length === 0) {
               delete spaceRoom[studioId]
            }
         }
      })

      socket.on('end space', (studioId) => {
         io.socketsLeave(studioId)
         delete spaceRoom[studioId]
      })

      socket.on('disconnect', () => {
         console.log('사용자 연결 해제:', user?.id)
         return socket.disconnect()
      })
   })

   return io
}
