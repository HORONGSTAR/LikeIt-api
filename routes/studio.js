const express = require('express')
const router = express.Router()
const { Project, Studio, User, Creator, StudioCreator, StudioAccount, Order } = require('../models')
const { Sequelize } = require('sequelize')

// 스튜디오 조회 (로그인한 유저의 스튜디오만 조회)
router.get('/:userId', async (req, res) => {
   try {
      const { userId } = req.params

      const studio = await Studio.findOne({
         where: { userId },
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

      if (!studio) {
         return res.status(404).json({ success: false, message: '스튜디오를 찾을 수 없습니다.' })
      }

      const projects = await Project.findAll({
         where: { studioId: studio.id },
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

// 스튜디오 생성
router.post('/', async (req, res) => {
   try {
      const { name, intro, imgUrl, snsLinks } = req.body

      if (!name || !intro || !imgUrl) {
         return res.status(400).json({ success: false, message: '스튜디오 이름, 소개, 프로필 이미지는 필수 입력 항목입니다.' })
      }

      const newStudio = await Studio.create({
         name,
         intro,
         imgUrl,
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
