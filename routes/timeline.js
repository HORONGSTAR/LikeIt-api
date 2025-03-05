const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { ProjectTimeline } = require('../models')
const { isLoggedIn } = require('./middlewares')

// 타임라인 이미지 저장 폴더 생성
try {
   fs.readdirSync('uploads/timelineImg')
} catch (error) {
   console.log('timelineImg 폴더 생성')
   fs.mkdirSync('uploads/timelineImg')
}

// 이미지 업로드 설정
const upload = multer({
   storage: multer.diskStorage({
      destination(req, file, cb) {
         cb(null, 'uploads/timelineImg/')
      },
      filename(req, file, cb) {
         const decodedFileName = decodeURIComponent(file.originalname)
         const ext = path.extname(decodedFileName)
         const basename = path.basename(decodedFileName, ext)
         cb(null, `${basename}_${Date.now()}${ext}`)
      },
   }),
   limits: { fileSize: 6 * 1024 * 1024 }, // 6MB 제한
})

//  타임라인 게시글 생성
router.post('/create', isLoggedIn, upload.single('image'), async (req, res) => {
   try {
      const { projectId, title, contents } = req.body
      const imgUrl = req.file ? `/uploads/timelineImg/${req.file.filename}` : null

      const existingTimeline = await ProjectTimeline.findOne({ where: { title, projectId } })

      if (existingTimeline) {
         return res.status(400).json({ success: false, message: '이미 존재하는 제목입니다. 다른 제목을 입력해주세요.' })
      }

      const newTimeline = await ProjectTimeline.create({
         projectId,
         title,
         contents,
         imgUrl,
      })

      res.json({ success: true, message: '타임라인 게시글 등록 성공', timeline: newTimeline })
   } catch (error) {
      console.error('타임라인 게시글 등록 오류:', error)
      res.status(500).json({ success: false, message: '게시글 등록 중 오류 발생', error: error.message })
   }
})

// 타임라인 게시글 수정
router.put('/:id', isLoggedIn, upload.single('image'), async (req, res) => {
   try {
      const { id } = req.params
      const { title, contents } = req.body
      const timeline = await ProjectTimeline.findByPk(id)

      if (!timeline) {
         return res.status(404).json({ success: false, message: '해당 게시글이 존재하지 않습니다.' })
      }

      await timeline.update({
         title,
         contents,
         imgUrl: req.file ? `/uploads/timelineImg/${req.file.filename}` : timeline.imgUrl,
      })

      res.json({ success: true, message: '게시글이 수정되었습니다.', timeline })
   } catch (error) {
      console.error('게시글 수정 오류:', error)
      res.status(500).json({ success: false, message: '게시글 수정 중 오류 발생', error: error.message })
   }
})

// 타임라인 게시글 삭제
router.delete('/:id', isLoggedIn, async (req, res) => {
   try {
      const { id } = req.params
      const timeline = await ProjectTimeline.findByPk(id)

      if (!timeline) {
         return res.status(404).json({ success: false, message: '해당 게시글이 존재하지 않습니다.' })
      }

      await timeline.destroy()
      res.json({ success: true, message: '게시글이 삭제되었습니다.' })
   } catch (error) {
      console.error('게시글 삭제 오류:', error)
      res.status(500).json({ success: false, message: '게시글 삭제 중 오류 발생', error: error.message })
   }
})

module.exports = router
