const express = require('express')
const router = express.Router()
const multer = require('multer')
const { Project, Reward, RewardProduct, StudioCreator } = require('../models')
const { isCreator } = require('./middlewares')
const fs = require('fs')
const path = require('path')

try {
   fs.readdirSync('uploads')
} catch (err) {
   console.log('uploads 폴더 생성')
   fs.mkdirSync('uploads')
}

try {
   fs.readdirSync('uploads/rewardProduct')
} catch (err) {
   console.log('projectImg 폴더 생성')
   fs.mkdirSync('uploads/rewardProduct')
}

const upload = multer({
   storage: multer.diskStorage({
      destination(req, file, cb) {
         cb(null, 'uploads/rewardProduct/')
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

// 선물 구성품 생성
router.post('/product/:id', isCreator, upload.single('image'), async (req, res) => {
   try {
      const { title, contents } = req.body
      const projectId = req.params.id

      await RewardProduct.create({
         title,
         contents,
         imgUrl: req.file.filename,
         projectId,
      })

      res.json({
         success: true,
         message: '선물 구성품이 성공적으로 생성되었습니다.',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '선물 구성품 생성 중 오류가 발생했습니다.' })
   }
})

// 선물 구성품 수정
router.put('/product/:id', upload.single('image'), async (req, res) => {
   try {
      const { id } = req.params

      const product = await RewardProduct.findByPk(id)
      if (!product) {
         return res.status(404).json({ success: false, message: '해당 선물 구성품이 존재하지 않습니다.' })
      }

      await product.update({
         ...req.body,
         imgUrl: req.file ? `/${req.file.filename}` : product.imgUrl,
      })

      res.json({ success: true, message: '선물 구성품 정보가 수정되었습니다.' })
   } catch (error) {
      console.error('선물 구성품 업데이트 오류:', error)
      res.status(500).json({ success: false, message: '서버 오류 발생', error: error.message })
   }
})

module.exports = router
