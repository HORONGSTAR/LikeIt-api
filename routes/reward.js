const express = require('express')
const router = express.Router()
const multer = require('multer')
const { Project, Reward, RewardProduct, RewardProductRelation } = require('../models')
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

// 특정 프로젝트 선물 조회
router.get('/:id', async (req, res) => {
   try {
      const project = await Project.findOne({
         where: { id: req.params.id },
         attributes: [],
         include: [{ model: RewardProduct }, { model: Reward, include: [{ model: RewardProduct, attributes: ['title'] }] }],
      })

      const { RewardProducts, Rewards } = project

      res.json({
         success: true,
         message: '선물 조회 성공',
         products: RewardProducts,
         rewards: Rewards,
      })
   } catch (error) {
      console.error('선물 조회 오류:', error)
      res.status(500).json({ success: false, message: '선물 목록을 불러오는 중 오류가 발생했습니다.' })
   }
})

// 선물 구성품 생성
router.post('/product/:id', upload.single('image'), async (req, res) => {
   try {
      const { title, contents } = req.body
      const projectId = req.params.id

      const product = await RewardProduct.create({
         title,
         contents,
         imgUrl: req.file.filename,
         projectId,
      })

      res.json({
         success: true,
         product,
         message: '선물 구성품이 성공적으로 생성되었습니다.',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({
         success: false,
         message: '선물 구성품 생성 중 오류가 발생했습니다.',
      })
   }
})

// 선물 구성품 수정
router.put('/product/:id', upload.single('image'), async (req, res) => {
   try {
      const { id } = req.params

      const product = await RewardProduct.findByPk(id)
      if (!product) {
         return res.status(404).json({
            success: false,
            message: '해당 선물 구성품이 존재하지 않습니다.',
         })
      }

      await product.update({
         ...req.body,
         imgUrl: req.file ? `/${req.file.filename}` : product.imgUrl,
      })

      res.json({
         success: true,
         product,
         message: '선물 구성품 정보가 수정되었습니다.',
      })
   } catch (error) {
      console.error('선물 구성품 업데이트 오류:', error)
      res.status(500).json({
         success: false,
         message: '서버 오류 발생',
         error: error.message,
      })
   }
})

// 선물 구성품 삭제
router.delete('/product/:id', async (req, res) => {
   try {
      const { id } = req.params

      const product = await RewardProduct.findByPk(id)
      if (!product) {
         return res.status(404).json({
            success: false,
            message: '해당 선물 구성품이 존재하지 않습니다.',
         })
      }

      const productId = product.id

      await product.destroy()

      res.json({
         success: true,
         productId,
         message: '선물 구성품 정보가 성공적으로 삭제되었습니다.',
      })
   } catch (error) {
      console.error('선물 구성품 삭제 중 오류:', error)
      res.status(500).json({
         success: false,
         message: '선물 구성품 삭제 중 오류가 발생했습니다.',
      })
   }
})

// 후원 선물 생성
router.post('/reward/:id', async (req, res) => {
   try {
      const projectId = req.params.id
      const { relation } = JSON.parse(req.body.relation)
      const reward = await Reward.create({
         ...req.body,
         projectId,
      })

      await Promise.all(
         relation.map((item) =>
            RewardProductRelation.create({
               stock: item.count,
               rewardId: reward.id,
               productId: item.id,
            })
         )
      )

      const newReward = await Reward.findOne({ where: { id: reward.id }, include: [{ model: RewardProduct, attributes: ['id', 'title'] }] })

      res.json({
         success: true,
         reward: newReward,
         message: '후원 선물이 성공적으로 생성되었습니다.',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({
         success: false,
         message: '후원 선물 생성 중 오류가 발생했습니다.',
      })
   }
})

// 후원 선물 수정
router.put('/reward/:id', async (req, res) => {
   try {
      const { id } = req.params
      const { relation } = JSON.parse(req.body.relation)

      const reward = await Reward.findByPk(id)
      if (!reward) {
         return res.status(404).json({
            success: false,
            message: '해당 후원 선물이 존재하지 않습니다.',
         })
      }

      await reward.update({
         ...req.body,
      })

      await Promise.all(
         relation.map((item) =>
            RewardProductRelation.upsert({
               stock: item.count,
               rewardId: reward.id,
               productId: item.id,
            })
         )
      )

      const newReward = await Reward.findOne({ where: { id: reward.id }, include: [{ model: RewardProduct, attributes: ['id', 'title'] }] })

      res.json({
         success: true,
         reward: newReward,
         message: '후원 선물 정보가 수정되었습니다.',
      })
   } catch (error) {
      console.error('후원 선물 업데이트 오류:', error)
      res.status(500).json({
         success: false,
         message: '서버 오류 발생',
         error: error.message,
      })
   }
})

// 후원 선물 삭제
router.delete('/reward/:id', async (req, res) => {
   try {
      const { id } = req.params

      const reward = await Reward.findByPk(id)
      if (!reward) {
         return res.status(404).json({
            success: false,
            message: '해당 후원 선물이 존재하지 않습니다.',
         })
      }
      const rewardId = reward.id
      await reward.destroy()

      res.json({
         success: true,
         rewardId,
         message: '후원 선물 정보가 성공적으로 삭제되었습니다.',
      })
   } catch (error) {
      console.error('후원 선물 삭제 중 오류:', error)
      res.status(500).json({
         success: false,
         message: '후원 선물 삭제 중 오류가 발생했습니다.',
      })
   }
})

module.exports = router
