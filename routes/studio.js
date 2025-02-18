const express = require('express')
const router = express.Router()
const { Project, Studio, User, Creator, StudioCreator, StudioAccount, Order } = require('../models')
const { Sequelize } = require('sequelize')

// 스튜디오 조회
router.get('/', async (req, res) => {
   try {
      const creatorId = (
         await Creator.findOne({
            where: { userId: req.user.id },
            attributes: ['id'],
         })
      )?.id

      if (!creatorId) {
         return res.status(400).json({ success: false, message: '창작자 정보를 찾을 수 없습니다.' })
      }

      const studioId = (
         await StudioCreator.findOne({
            where: { creatorId },
            attributes: ['studioId'],
         })
      )?.studioId

      if (!studioId) {
         return res.status(400).json({ success: false, message: '스튜디오를 찾을 수 없습니다.' })
      }

      const studio = await Studio.findOne({
         where: { id: studioId },
         include: [
            {
               model: StudioCreator,
               include: [{ model: Creator, include: [User] }],
            },
            { model: StudioAccount },
         ],
      })

      const projects = await Project.findAll({
         subQuery: false,
         where: { studioId },
         include: [{ model: Order, attributes: [], required: false }],
         attributes: {
            include: [[Sequelize.fn('SUM', Sequelize.col('Orders.orderPrice')), 'totalOrderPrice']],
         },
         group: ['Project.id'],
         order: [['startDate', 'DESC']],
      })

      res.json({ success: true, message: '스튜디오 조회 성공', studio, projects })
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

// 스튜디오 수정
router.put('/:id', async (req, res) => {
   try {
      const { name, intro, imgUrl, snsLinks } = req.body
      const studioId = req.params.id

      const studio = await Studio.findByPk(studioId)
      if (!studio) {
         return res.status(404).json({ success: false, message: '스튜디오를 찾을 수 없습니다.' })
      }

      await studio.update({ name, intro, imgUrl })

      if (snsLinks && snsLinks.length > 0) {
         await StudioAccount.destroy({ where: { studioId } })
         await Promise.all(
            snsLinks.map((sns) =>
               StudioAccount.create({
                  studioId: studio.id,
                  platform: sns.platform,
                  link: sns.link,
               })
            )
         )
      }

      res.json({
         success: true,
         message: '스튜디오가 성공적으로 수정되었습니다.',
         studio: studio,
      })
   } catch (error) {
      console.error('스튜디오 수정 오류:', error)
      res.status(500).json({ success: false, message: '스튜디오 수정 중 오류가 발생했습니다.' })
   }
})

// 특정 스튜디오 조회
router.get('/:id', async (req, res) => {
   try {
      const studio = await Studio.findOne({
         where: { id: req.params.id },
         include: [
            {
               model: StudioAccount, // SNS 계정 정보 포함
            },
         ],
      })

      if (!studio) {
         return res.status(404).json({ success: false, message: '스튜디오를 찾을 수 없습니다.' })
      }

      res.json({ success: true, data: studio })
   } catch (error) {
      console.error('스튜디오 조회 오류:', error)
      res.status(500).json({ success: false, message: '스튜디오를 불러오는 중 오류가 발생했습니다.' })
   }
})

module.exports = router
