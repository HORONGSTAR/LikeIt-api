const { Server } = require('socket.io')
const passport = require('passport')

module.exports = (server, sessionMiddleware) => {
   // Socket.IO 서버 생성
   const io = new Server(server, {
      cors: {
         origin: process.env.FRONTEND_APP_URL, // 클라이언트의 url 허용
         methods: ['GET', 'POST'], //허용된 http 메서드, 다른 메서드(put, delete, patch)는 차단(클라이언트가 delete요청을 보내 데이터가 삭제되는 상황 방지)
         credentials: true,
      },
   })

   let broadcaster = null

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

      socket.on('user info', (msg) => {
         if (msg) {
            socket.emit('user info', user)
         }
      })

      socket.on('chat message', (msg) => {
         io.emit('chat message', { user: user?.name, imgUrl: user?.imgUrl, message: msg })
      })

      socket.on('disconnect', () => {
         console.log('사용자 연결 해제:', user?.id)
         return socket.disconnect()
      })

      socket.on('broadcaster', () => {
         isBroadcasting = true
         broadcaster = user?.id
         socket.broadcast.emit('broadcaster')
         console.log('방송자 연결됨: ', user?.id)
      })

      socket.on('broadcastStarted', () => {
         io.emit('broadcastStarted', isBroadcasting)
      })

      socket.on('watcher', () => {
         if (broadcaster) {
            io.to(broadcaster).emit('watcher', user?.id)
            console.log('청취자 연결됨: ', user?.id)
         }
      })

      socket.on('offer', (offer, watcherId) => {
         io.to(watcherId).emit('offer', offer, user?.id)
      })

      socket.on('answer', (answer, broadcasterId) => {
         io.to(broadcasterId).emit('answer', answer, user?.id)
      })

      socket.on('candidate', (candidate, targetId) => {
         io.to(targetId).emit('candidate', candidate, user?.id)
      })

      socket.on('disconnect', () => {
         if (user?.id === broadcaster) {
            isBroadcasting = false
            broadcaster = null
            io.emit('broadcasterDisconnected')
            console.log('방송자 연결 해제:', user?.id)
         }
      })

      socket.on('broadcastStopped', () => {
         io.emit('broadcastStopped', isBroadcasting)
      })
   })

   return io
}
