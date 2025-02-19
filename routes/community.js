const express = require('express')
const { StudioCommunity, User } = require('../models')
const multer = require('multer')
const router = express.Router()
const path = require('path')
const fs = require('fs')

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
   limits: { fileSize: 50 * 1024 * 1024 },
})

// 커뮤니티 목록 조회
router.get('/list', async (req, res) => {
   try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 4
      const offset = (page - 1) * limit
      const { studioId } = req.query

      const where = {}
      if (studioId) {
         where.studioId = studioId
      }

      const communities = await StudioCommunity.findAll({
         where,
         limit,
         offset,
         attributes: ['id', 'title', 'notice', 'studioId', 'createdAt'],
         order: [['createdAt', 'DESC']],
         include: [
            {
               model: User,
               attributes: ['name', 'imgUrl'],
            },
         ],
      })

      res.json({ success: true, communities })
   } catch (error) {
      console.error('커뮤니티 목록 불러오기 실패:', error)
      res.status(500).json({ success: false, message: '서버 오류', error })
   }
})

// 특정 게시물 조회
router.get('/:id', async (req, res) => {
   try {
      const community = await StudioCommunity.findOne({
         where: { id: req.params.id },
         include: [
            {
               model: User,
               attributes: ['name', 'imgUrl'],
            },
         ],
      })

      if (!community) {
         return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' })
      }
      const response = { ...community.toJSON(), imgUrl: community.imgUrl || '' }
      res.json({ success: true, community: response })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '게시물을 불러오는 중 오류가 발생했습니다.', error })
   }
})

// 게시물 등록
router.post('/', upload.single('image'), async (req, res) => {
   try {
      const { title, contents, studioId, userId } = req.body

      if (!studioId || !userId) {
         return res.status(400).json({ success: false, message: '스튜디오 ID 또는 사용자 ID가 없습니다.' })
      }

      const imgUrl = req.file ? `/uploads/studioImg/${req.file.filename}` : null

      const newPost = await StudioCommunity.create({
         title,
         contents,
         imgUrl,
         studioId,
         userId,
      })

      res.status(201).json({ success: true, community: newPost, message: '게시물이 등록되었습니다.' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '게시물 등록 중 오류가 발생했습니다.', error })
   }
})

// 게시물 수정
router.put('/:id', upload.single('image'), async (req, res) => {
   try {
      const { id } = req.params
      const { title, contents, removeImage } = req.body

      const community = await StudioCommunity.findByPk(id)
      if (!community) {
         return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' })
      }

      let imgUrl = community.imgUrl // 기본적으로 기존 이미지 유지
      if (req.file) {
         imgUrl = `/uploads/studioImg/${req.file.filename}` // 새 이미지 업로드
      } else if (removeImage === 'true') {
         imgUrl = null // 기존 이미지 삭제
      }

      await community.update({
         title: title || community.title,
         contents: contents || community.contents,
         imgUrl,
      })

      res.json({ success: true, community, message: '게시물이 수정되었습니다.' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '게시물 수정 중 오류가 발생했습니다.', error })
   }
})

// 게시물 삭제
router.delete('/:id', async (req, res) => {
   try {
      const { id } = req.params

      const community = await StudioCommunity.findByPk(id)
      if (!community) {
         return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' })
      }

      await community.destroy()

      res.json({ success: true, message: '게시물이 삭제되었습니다.' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '게시물 삭제 중 오류가 발생했습니다.', error })
   }
})

module.exports = router
