const express = require('express')
const router = express.Router()
const { Project, Studio, User, Creator, StudioCreator, StudioAccount, Order } = require('../models')
const { Sequelize } = require('sequelize')

router.get('/', async (req, res) => {
   try {
      const studio = await Studio.findOne({
         where: { id: 1 },
         include: [
            {
               model: StudioCreator,
               include: [
                  {
                     model: Creator,
                     include: [{ model: User }],
                  },
               ],
            },
            {
               model: StudioAccount,
            },
         ],
      })

      const projects = await Project.findAll({
         subQuery: false,
         where: { studioId: 1 },
         include: [
            {
               model: Order,
               attributes: [],
               required: false,
            },
         ],

         attributes: {
            include: [[Sequelize.fn('SUM', Sequelize.col('Orders.orderPrice')), 'totalOrderPrice']],
         },
         group: ['Project.id'],
         order: [['startDate', 'DESC']],
      })

      console.log(projects)

      res.json({
         success: true,
         message: '스튜디오 조회 성공',
         studio,
         projects,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '스튜디오를 호출하는 중에 오류가 발생했습니다.' })
   }
})

router.post('/', async (req, res) => {
   try {
      const { name, description, snsLinks } = req.body

      if (!name || !description) {
         return res.status(400).json({ success: false, message: '스튜디오 이름과 소개는 필수 입력 항목입니다.' })
      }

      const newStudio = await Studio.create({
         name,
         description,
      })

      if (snsLinks && snsLinks.length > 0) {
         for (const sns of snsLinks) {
            await StudioAccount.create({
               studioId: newStudio.id,
               platform: sns.platform,
               link: sns.link,
            })
         }
      }

      res.json({
         success: true,
         message: '스튜디오가 성공적으로 생성되었습니다.',
         studio: newStudio,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '스튜디오 생성 중 오류가 발생했습니다.' })
   }
})

module.exports = router
