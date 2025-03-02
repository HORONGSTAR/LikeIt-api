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

   const spaceRoom = {}
   const today = new Date()

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

   io.on('connection', (socket) => {
      const user = socket.request.user
      const rooms = io.sockets.adapter.rooms
      console.log(`${user.id}번 유저 서버 연결.`)

      socket.emit('active server', '소켓 서버 활성화.')

      socket.on('space info', (studioId) => {
         const room = spaceRoom[studioId]
         if (room) {
            socket.emit('space info', room)
            console.log(`${studioId}번 스페이스 정보 요청.`)
         } else {
            socket.emit('space info', null)
            console.log(`${studioId}번 스페이스 정보 없음.`)
         }
      })

      socket.on('start space', (studioId) => {
         if (!spaceRoom[studioId]) {
            socket.join(studioId)
            spaceRoom[studioId] = {
               admin: { id: user.id, name: user.name, imgUrl: user.imgUrl },
               socketId: { [user.id]: socket.id },
               startTime: today,
            }
            socket.emit('space info', spaceRoom[studioId])
            console.log(`${studioId}번 스페이스 시작.`)
         } else {
            console.log(`${studioId}번 스페이스 진행 중.`)
         }
      })

      socket.on('join space', (studioId) => {
         if (spaceRoom[studioId]) {
            socket.join(studioId)
            spaceRoom[studioId].socketId[user.id] = socket.id
            io.to(studioId).emit('user info', {
               id: user.id,
               name: user.name,
               imgUrl: user.imgUrl,
            })
            console.log(`${studioId}번 스페이스에 ${user.id}번 유저 입장.`)
         }
      })

      socket.on('offer', (offer, studioId) => {
         io.to(studioId).emit('offer', offer, user.id)
         console.log('offer:', rooms)
      })

      socket.on('answer', (answer, adminId) => {
         spaceRoom[studioId].socketId[adminId].emit('answer', answer)
         console.log('answer : ', spaceRoom[studioId].socketId[adminId])
      })

      socket.on('candidate', (candidate, studioId) => {
         io.to(studioId).emit('candidate', candidate, socket.id)
         console.log('candidate : ', candidate)
      })

      socket.on('chat message', (studioId, msg) => {
         if (studioId && msg) {
            io.to(studioId).emit('chat message', { name: user.name, message: msg, imgUrl: user.imgUrl })
            console.log('chat message : ', msg, studioId)
            console.log('rooms: ', rooms)
            console.log(spaceRoom)
         }
      })

      socket.on('leave space', (studioId) => {
         if (spaceRoom[studioId]) {
            socket.leave(studioId)
            delete spaceRoom[studioId].socketId[user.id]
            console.log(`${studioId}번 스페이스의 ${user.id}번 유저 퇴장.`)
         }
      })

      socket.on('end space', (studioId) => {
         if (spaceRoom[studioId].admin.id === user?.id) {
            socket.leave(studioId)
            delete spaceRoom[studioId]
            console.log(`${studioId}번 스페이스 종료.`)
         }
      })

      socket.on('disconnect', (studioId) => {
         console.log(`${user.id}번 유저 연결 해제.`)
         return socket.disconnect()
      })
   })

   return io
}
