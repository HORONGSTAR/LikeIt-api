const { Server } = require('socket.io')
const passport = require('passport')

module.exports = (server, sessionMiddleware) => {
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
         return socket.disconnect()
      }
   })

   const studio = {}
   const today = new Date()

   io.on('connection', (socket) => {
      const user = socket.request.user
      console.log(`${user.id}번 유저 서버 연결.`)

      socket.on('space info', (studioId) => {
         if (studio[studioId]) {
            socket.emit('space info', studio[studioId])
         }
      })

      socket.on('create space', (studioId) => {
         if (!studio[studioId]) {
            const { id, name, imgUrl } = user
            studio[studioId] = {
               admin: { id, name, imgUrl },
               socketId: { [user.id]: socket.id },
               startTime: today,
            }
            socket.emit('space info', studio[studioId])
         }
      })

      socket.on('join space', (studioId) => {
         if (studio[studioId]) {
            socket.join(studioId)
            studio[studioId].socketId[user.id] = socket.id
            io.to(studioId).emit('user info', {
               name: user.name,
               imgUrl: user.imgUrl,
            })
            const adminId = studio[studioId].admin.id
            const broadcasterId = studio[studioId].socketId[adminId]
            io.to(broadcasterId).emit('new listener', socket.id)
         }
      })

      socket.on('offer', ({ offer, listenerId }) => {
         io.to(listenerId).emit('offer', { offer, broadcasterId: socket.id })
         console.log('offer')
      })

      socket.on('answer', ({ answer, broadcasterId }) => {
         io.to(broadcasterId).emit('answer', { answer, listenerId: socket.id })
         console.log('answer')
      })

      socket.on('ice-candidate', ({ targetId, candidate }) => {
         io.to(targetId).emit('ice-candidate', { candidate })
         console.log('ice-candidate')
      })

      socket.on('chat message', (msg, studioId) => {
         if (msg) {
            const { name, imgUrl } = user
            io.to(studioId).emit('send message', { name, imgUrl, message: msg })
         } else {
            console.log('메세지 전송 실패')
         }
      })

      socket.on('leave space', (studioId) => {
         if (studio[studioId]) {
            socket.leave(studioId)
            console.log('leave space')
            delete studio[studioId].socketId[user.id]
         }
      })

      socket.on('end space', (studioId) => {
         if (studio[studioId]?.admin?.id === user?.id) {
            socket.leave(studioId)
            console.log('end space')
            delete studio[studioId]
         }
      })

      socket.on('disconnect', (studioId) => {
         console.log(`${user.id}번 유저 연결 해제.`)
         return socket.disconnect()
      })
   })

   return io
}
