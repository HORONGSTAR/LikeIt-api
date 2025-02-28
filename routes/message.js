const express = require('express')
const { Message, Project, Studio } = require('../models')
const router = express.Router()
const { isLoggedIn } = require('./middlewares')
const { Sequelize } = require('sequelize')

// 유저 쪽지 확인
router.get('/', isLoggedIn, async (req, res) => {
   const page = parseInt(req.query.page, 10) || 1
   const limit = parseInt(req.query.limit, 10) || 10
   const offset = (page - 1) * limit
   const userId = req.user.id
   let count = 0

   try {
      count = await Message.count({
         where: { receiveUserId: userId },
      })
      const messages = await Message.findAll({
         limit,
         offset,
         attributes: {
            include: [
               [
                  Sequelize.literal(`
          CASE 
            WHEN Message.imgType = 'PROJECT' THEN 
              (SELECT imgUrl FROM Projects WHERE id = Message.imgId LIMIT 1)
            WHEN Message.imgType = 'STUDIO' THEN 
              (SELECT imgUrl FROM Studios WHERE id = Message.imgId LIMIT 1)
            ELSE NULL
          END
        `),
                  'imgUrl', // 새로 추가된 imgUrl 컬럼
               ],
            ],
         },
         where: { receiveUserId: userId },
      })
      res.json({
         messages,
         count,
         success: true,
         message: '메시지 목록 조회 성공',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '메시지 목록을 가져오는데 문제가 발생했습니다.' })
   }
})

module.exports = router
