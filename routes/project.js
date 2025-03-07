const express = require('express')
const router = express.Router()
const multer = require('multer')
const { Project, StudioCreator, RewardProduct, Reward, ProjectBudget, CreatorBudget, Studio } = require('../models')
const { isCreator } = require('./middlewares')
const fs = require('fs')
const path = require('path')
const e = require('express')

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

// 특정 스튜디오의 프로젝트 목록 조회
router.get('/studio/:studioId', async (req, res) => {
   const page = parseInt(req.query.page) || 1
   const limit = parseInt(req.query.limit) || 5
   const offset = (page - 1) * limit

   try {
      const { studioId } = req.params
      const { rows: projects, count } = await Project.findAndCountAll({
         where: { studioId },
         include: [{ model: RewardProduct }, { model: Reward }],
         order: [['startDate', 'DESC']],
         offset,
         limit,
      })

      res.json({
         success: true,
         message: '특정 스튜디오의 프로젝트 목록 조회 성공',
         projects,
         totalCount: count,
         currentPage: page,
         totalPages: Math.ceil(count / limit),
      })
   } catch (error) {
      console.error('특정 스튜디오의 프로젝트 조회 오류:', error)
      res.status(500).json({ success: false, message: '서버 오류', error })
   }
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
         include: [
            { model: RewardProduct },
            {
               model: Reward,
               include: [{ model: RewardProduct, attributes: ['id', 'title'] }],
            },
         ],
      })

      if (!project) {
         return res.status(401).json({ success: false, message: '해당 프로젝트가 존재하지 않습니다.' })
      }

      await project.update({
         ...req.body,
         imgUrl: req.file ? `/${req.file.filename}` : project.imgUrl,
      })

      const budget = {}
      if (req.body.projBudg) {
         const { projBudg, removeProjBudg } = JSON.parse(req.body.projBudg)
         const { creaBudg, removeCreaBudg } = JSON.parse(req.body.creaBudg)

         await removeProjBudg.map((id) => ProjectBudget.destroy({ where: { id: id } }))
         await removeCreaBudg.map((id) => CreatorBudget.destroy({ where: { id: id } }))

         const projectBudgets = await Promise.all(
            projBudg.map((p) =>
               ProjectBudget.upsert({
                  id: p.id,
                  contents: p.contents,
                  money: p.money,
                  projectId: project.id,
               })
            )
         )

         const creatorBudgets = await Promise.all(
            creaBudg.map((c) =>
               CreatorBudget.upsert({
                  id: c.id,
                  contents: c.contents,
                  money: c.money,
                  studioCreatorId: c.studioCreatorId,
                  projectId: project.id,
               })
            )
         )

         budget.ProjectBudgets = projectBudgets.map((p) => p[0])
         budget.CreatorBudgets = creatorBudgets.map((c) => c[0])
      }

      res.json({
         success: true,
         message: '프로젝트 정보가 수정되었습니다.',
         project,
         budget,
      })
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
         include: [
            { model: RewardProduct },
            {
               model: Reward,
               include: [{ model: RewardProduct, attributes: ['id', 'title'] }],
            },
            { model: ProjectBudget },
            { model: CreatorBudget },
            {
               model: Studio,
               attributes: ['name'],
            },
         ],
      })

      res.json({
         success: true,
         message: '프로젝트 조회 성공',
         project,
         studioName: project.Studio ? project.Studio.name : null,
      })
   } catch (error) {
      console.error('프로젝트 조회 오류:', error)
      res.status(500).json({ success: false, message: '프로젝트를 불러오는 중 오류가 발생했습니다.' })
   }
})

module.exports = router
