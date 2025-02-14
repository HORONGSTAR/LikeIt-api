const express = require('express')
const router = express.Router()
const multer = require('multer')
const { Project, Studio, User, Creator, StudioCreator, StudioAccount, Order } = require('../models')
const { Sequelize } = require('sequelize')

const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'uploads/studioImg/') // 업로드 경로 설정
   },
   filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`) // 고유한 파일명 생성
   },
})

const upload = multer({ storage })

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
      const { name, intro, snsLinks } = req.body

      if (!name || !intro) {
         return res.status(400).json({ success: false, message: '스튜디오 이름과 소개는 필수 입력 항목입니다.' })
      }

      //  이미지가 있을 경우 imgUrl 설정
      const imgUrl = req.file ? `/uploads/studioImg/${req.file.filename}` : null

      const newStudio = await Studio.create({
         name,
         intro,
         imgUrl,
      })

      // snsLinks JSON 변환
      const parsedSnsLinks = typeof snsLinks === 'string' ? JSON.parse(snsLinks) : snsLinks || []

      if (parsedSnsLinks.length > 0) {
         await Promise.all(
            parsedSnsLinks.map((sns) =>
               StudioAccount.create({
                  studioId: newStudio.id,
                  platform: sns.platform,
                  link: sns.link,
               })
            )
         )
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
router.put('/:id', upload.single('image'), async (req, res) => {
   try {
      const { id } = req.params
      const { name, intro, sns_links } = req.body
      const imageUrl = req.file ? `/uploads/studioImg/${req.file.filename}` : null

      const studio = await Studio.findByPk(id)
      if (!studio) {
         return res.status(404).json({ success: false, message: '해당 스튜디오가 존재하지 않습니다.' })
      }

      await studio.update({
         name,
         intro,
         snsLinks: sns_links ? JSON.parse(sns_links) : [],
         imgUrl: imageUrl || studio.imgUrl,
      })

      res.json({ success: true, message: '스튜디오 정보가 수정되었습니다.', studio })
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

// 업로드
router.post('/upload', upload.single('image'), (req, res) => {
   try {
      if (!req.file) {
         return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' })
      }

      console.log('업로드된 파일:', req.file) // 로그 추가

      const fileUrl = `/uploads/studioImg/${req.file.filename}`
      res.json({ success: true, imgUrl: fileUrl })
   } catch (error) {
      console.error('파일 업로드 오류:', error)
      res.status(500).json({ success: false, message: '서버 오류: 파일 업로드 실패' })
   }
})

module.exports = router
