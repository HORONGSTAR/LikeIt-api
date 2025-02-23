const express = require('express')
const router = express.Router()
const multer = require('multer')
const { Project, Studio, User, Creator, StudioCreator, RewardProductRelation, RewardProduct, Reward } = require('../models')
const { isCreator } = require('./middlewares')
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
   fs.readdirSync('uploads/projectImg')
} catch (err) {
   console.log('projectImg 폴더 생성')
   fs.mkdirSync('uploads/projectImg')
}

const upload = multer({
   storage: multer.diskStorage({
      destination(req, file, cb) {
         cb(null, 'uploads/projectImg/')
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

// 프로젝트 생성
router.post('/create', isCreator, async (req, res) => {
   try {
      const creatorId = req.user.Creator.id

      const studioId = (
         await StudioCreator.findOne({
            where: { creatorId },
            attributes: ['studioId'],
         })
      )?.studioId

      if (!studioId) {
         return res.status(404).json({ success: false, message: '프로젝트 생성 전 스튜디오가 필요합니다.' })
      }

      const today = new Date()
      const newProject = await Project.create({
         title: req.body.title,
         intro: '',
         startDate: today,
         endDate: today,
         goal: 0,
         contents: '',
         schedule: '',
         imgUrl: '',
         studioId,
      })

      res.json({
         success: true,
         message: '프로젝트가 성공적으로 생성되었습니다.',
         project: newProject,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '프로젝트 생성 중 오류가 발생했습니다.' })
   }
})

// 프로젝트 수정
router.put('/edit/:id', upload.single('image'), async (req, res) => {
   try {
      const project = await Project.findOne({
         where: { id: req.params.id },
         include: [{ model: RewardProduct }, { model: Reward }],
      })
      if (!project) {
         return res.status(401).json({ success: false, message: '해당 프로젝트가 존재하지 않습니다.' })
      }

      await project.update({
         ...req.body,
         imgUrl: req.file ? `/${req.file.filename}` : project.imgUrl,
      })

      const { rewards } = JSON.parse(req.body.rewards)

      await Promise.all(
         rewards.map((reward) => {
            Reward.create({
               name: reward.name,
               contents: reward.contents,
               count: reward.count,
               price: reward.price,
               stock: reward.stock,
               limit: reward.limit,
               projectId: project.id,
            })
         })
      )

      const newRewards = await Reward.findAll({ where: { projectId: project.id } })

      await Promise.all(
         rewards.map((reward, index) => {
            reward.relation.map((r) => {
               RewardProductRelation.create({
                  stock: r.count,
                  rewardId: newRewards[index].id,
                  productId: r.id,
               })
            })
         })
      )

      res.json({ success: true, message: '프로젝트 정보가 수정되었습니다.', project })
   } catch (error) {
      console.error('프로젝트 업데이트 오류:', error)
      res.status(500).json({ success: false, message: '서버 오류 발생', error: error.message })
   }
})

// 특정 프로젝트 조회
router.get('/:id', async (req, res) => {
   try {
      const project = await Project.findOne({
         where: { id: req.params.id },
         include: [{ model: RewardProduct }, { model: Reward }],
      })

      res.json({
         success: true,
         message: '프로젝트 조회 성공',
         project,
      })
   } catch (error) {
      console.error('프로젝트 조회 오류:', error)
      res.status(500).json({ success: false, message: '프로젝트를 불러오는 중 오류가 발생했습니다.' })
   }
})

module.exports = router
