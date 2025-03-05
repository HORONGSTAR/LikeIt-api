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
   const socketId = {}
   const today = new Date()

   io.on('connection', (socket) => {
      const user = socket.request.user
      console.log(`${user.id}번 유저 서버 연결.`)

      socket.on('space info', (studioId) => {
         socket.join(studioId)
         socketId[user.id] = socket.id
         if (studio[studioId]) {
            io.to(studioId).emit('space info', studio[studioId])
         }
      })

      socket.on('create space', (studioId) => {
         if (!studio[studioId]) {
            const { id, name, imgUrl } = user
            studio[studioId] = {
               id: id,
               admin: { name, imgUrl },
               users: {},
               startTime: today,
            }
            io.to(studioId).emit('space info', studio[studioId])
         }
      })

      socket.on('enter space', (studioId) => {
         if (studio[studioId]) {
            const { id, name, imgUrl } = user
            studio[studioId].users[id] = { name, imgUrl }
            const broadcasterId = socketId[studio[studioId].id]
            io.to(broadcasterId).emit('new listener', { listenerId: user.id })
         }
      })

      socket.on('offer', ({ offer, listenerId }) => {
         io.to(socketId[listenerId]).emit('offer', { offer, broadcasterId: user.id })
      })

      socket.on('answer', ({ answer, broadcasterId }) => {
         io.to(socketId[broadcasterId]).emit('answer', { answer, listenerId: user.id })
      })

      socket.on('ice-candidate', ({ targetId, candidate }) => {
         io.to(socketId[targetId]).emit('ice-candidate', { candidate })
      })

      socket.on('chat message', (msg, studioId) => {
         if (msg) {
            const { name, imgUrl } = user
            io.to(studioId).emit('send message', { name, imgUrl, message: msg })
         }
      })

      socket.on('leave space', (studioId) => {
         if (studio[studioId]) {
            const broadcasterId = socketId[studio[studioId].id]
            io.to(broadcasterId).emit('leave listener', { listenerId: user.id })
            io.to(socket.id).emit('leave space', '스페이스 퇴장')
            delete studio[studioId].users[user?.id]
         }
      })

      socket.on('end space', (studioId) => {
         if (studio[studioId]?.id === user?.id) {
            io.to(studioId).emit('end space', '스페이스 종료')
            delete studio[studioId]
         }
      })

      socket.on('disconnect', () => {
         console.log(`${user.id}번 유저 연결 해제.`)
         return socket.disconnect()
      })
   })

   return io
}
