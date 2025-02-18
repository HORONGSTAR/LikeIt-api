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
router.post('/create', upload.single('image'), async (req, res) => {
   try {
      const { title, intro, startDate, endDate } = req.body
      const newProject = await Project.create({
         title,
         intro,
         startDate,
         endDate,
         imgUrl: req.file.filename,
         goal: 0,
         contents: 'EMPTY',
         schedule: 'EMPTY',
      })

      res.json({
         success: true,
         message: '프로젝트가 성공적으로 생성되었습니다.',
         studio: newProject,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '프로젝트 생성 중 오류가 발생했습니다.' })
   }
})

// 프로젝트 수정
router.put('/:id', upload.single('image'), async (req, res) => {
   try {
      const { id } = req.params
      const { name, intro, account } = req.body
      const imageUrl = req.file ? `/uploads/studioImg/${req.file.filename}` : null

      const studio = await Studio.findByPk(id)
      if (!studio) {
         return res.status(404).json({ success: false, message: '해당 프로젝트가 존재하지 않습니다.' })
      }

      await studio.update({
         name,
         intro,
         imgUrl: imageUrl || studio.imgUrl,
      })

      const { snsLinks, removeSns } = JSON.parse(account)

      await snsLinks.map(
         (sns) =>
            sns.id ||
            StudioAccount.create({
               studioId: id,
               type: sns.type,
               contents: sns.contents,
            })
      )

      await removeSns.map((id) => StudioAccount.destroy({ where: { id: id } }))

      res.json({ success: true, message: '프로젝트 정보가 수정되었습니다.', studio })
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
