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
               admin: { id, name, imgUrl, socketId: socket.id },
               users: {},
               startTime: today,
            }
            socket.emit('space info', studio[studioId])
         }
      })

      socket.on('join space', (studioId) => {
         if (studio[studioId]) {
            const { id, name, imgUrl } = user
            socket.join(studioId)
            studio[studioId].users[id] = { name, imgUrl }
            const broadcasterId = studio[studioId].admin.socketId
            io.to(broadcasterId).emit('new listener', socket.id)
         }
      })

      socket.on('offer', ({ offer, listenerId }) => {
         io.to(listenerId).emit('offer', { offer, broadcasterId: socket.id })
      })

      socket.on('answer', ({ answer, broadcasterId }) => {
         io.to(broadcasterId).emit('answer', { answer, listenerId: socket.id })
      })

      socket.on('ice-candidate', ({ targetId, candidate }) => {
         io.to(targetId).emit('ice-candidate', { candidate })
      })

      socket.on('chat message', (msg, studioId) => {
         if (msg) {
            const { name, imgUrl } = user
            io.to(studioId).emit('send message', { name, imgUrl, message: msg })
         }
      })

      socket.on('leave space', (studioId) => {
         if (studio[studioId]) {
            socket.leave(studioId)
            delete studio[studioId].users[user?.id]
         }
      })

      socket.on('end space', (studioId) => {
         if (studio[studioId]?.admin?.id === user?.id) {
            socket.leave(studioId)
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
