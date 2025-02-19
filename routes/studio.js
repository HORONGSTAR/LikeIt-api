const express = require('express')
const router = express.Router()
const multer = require('multer')
const { Project, Studio, User, Creator, StudioCreator, StudioAccount, Order } = require('../models')
const { Sequelize } = require('sequelize')
const fs = require('fs')
const path = require('path')

try {
   fs.readdirSync('uploads')
} catch (err) {
   console.log('uploads 폴더 생성')
   fs.mkdirSync('uploads')
}

try {
   fs.readdirSync('uploads/studioImg')
} catch (err) {
   console.log('studioImg 폴더 생성')
   fs.mkdirSync('uploads/studioImg')
}

const upload = multer({
   storage: multer.diskStorage({
      destination(req, file, cb) {
         cb(null, 'uploads/studioImg/')
      },
      filename(req, file, cb) {
         const decodedFileName = decodeURIComponent(file.originalname)
         const ext = path.extname(decodedFileName)
         const basename = path.basename(decodedFileName, ext)
         cb(null, basename + Date.now() + ext)
      },
   }),
   limits: { fileSize: 6 * 1024 * 1024 },
})

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
router.post('/', upload.single('image'), async (req, res) => {
   try {
      const { name, intro, account } = req.body

      const creatorId = (
         await Creator.findOne({
            where: { userId: req.user.id },
            attributes: ['id'],
         })
      )?.id

      if (!creatorId) {
         return res.status(400).json({ success: false, message: '창작자 정보를 찾을 수 없습니다.' })
      }

      const newStudio = await Studio.create({
         name,
         intro,
         imgUrl: req.file.filename,
      })

      await StudioCreator.create({
         role: 'LEADER',
         communityAdmin: 'Y',
         spaceAdmin: 'Y',
         creatorId: creatorId,
         studioId: newStudio.id,
      })

      const snsLinks = JSON.parse(account).snsLinks

      await Promise.all(
         snsLinks.map((sns) => {
            StudioAccount.create({
               studioId: newStudio.id,
               type: sns.type,
               contents: sns.contents,
            })
         })
      )

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
router.put('/:id', upload.single('image'), async (req, res) => {
   try {
      const { id } = req.params
      const { name, intro, account } = req.body
      const imageUrl = req.file ? `/uploads/studioImg/${req.file.filename}` : null

      const studio = await Studio.findByPk(id)
      if (!studio) {
         return res.status(404).json({ success: false, message: '해당 스튜디오가 존재하지 않습니다.' })
      }

      await studio.update({
         name: name || studio.name,
         intro: intro || studio.intro,
         imgUrl: imageUrl || studio.imgUrl,
      })

      // const { snsLinks, removeSns } = JSON.parse(account)

      // await snsLinks.map(
      //    (sns) =>
      //       sns.id ||
      //       StudioAccount.create({
      //          studioId: id,
      //          type: sns.type,
      //          contents: sns.contents,
      //       })
      // )

      // await removeSns.map((id) => StudioAccount.destroy({ where: { id: id } }))

      const updatedStudio = await Studio.findOne({
         where: { id },
         include: [
            {
               model: StudioCreator,
               include: [{ model: Creator, include: [User] }],
            },
            { model: StudioAccount },
         ],
      })

      res.json({ success: true, message: '스튜디오 정보가 수정되었습니다.', studio: updatedStudio })
   } catch (error) {
      console.error('스튜디오 업데이트 오류:', error)
      res.status(500).json({ success: false, message: '서버 오류 발생', error: error.message })
   }
})

// 특정 스튜디오 조회
router.get('/:id', async (req, res) => {
   try {
      const studio = await Studio.findOne({
         where: { id: req.params.id },
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
         where: { studioId: req.params.id },
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

      res.json({
         success: true,
         message: '스튜디오 조회 성공',
         studio,
         projects,
      })
   } catch (error) {
      console.error('스튜디오 조회 오류:', error)
      res.status(500).json({ success: false, message: '스튜디오를 불러오는 중 오류가 발생했습니다.' })
   }
})

module.exports = router
