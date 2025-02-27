const express = require('express')
const router = express.Router()
const { Order, User, Reward, Project } = require('../models')
const { isCreator } = require('./middlewares')
const { Sequelize } = require('sequelize')
const multer = require('multer')
const xlsx = require('xlsx')

const upload = multer({ dest: 'uploads/' })

// 운송장 등록
router.post('/upload-tracking', isCreator, upload.single('file'), async (req, res) => {
   try {
      if (!req.file) {
         return res.status(400).json({ success: false, message: '엑셀 파일을 업로드해주세요.' })
      }

      const workbook = xlsx.readFile(req.file.path)
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = xlsx.utils.sheet_to_json(sheet)

      if (!jsonData.length) {
         return res.status(400).json({ success: false, message: '엑셀 파일이 비어 있습니다.' })
      }

      let updatedCount = 0

      for (const row of jsonData) {
         const { 주문ID, 택배사, 운송장번호 } = row
         console.log('엑셀에서 읽은 데이터:', 주문ID, 택배사, 운송장번호) // 디버깅용

         if (!주문ID || !택배사 || !운송장번호) continue

         const order = await Order.findByPk(주문ID)
         if (!order) {
            console.log(`주문ID ${주문ID}을 찾을 수 없습니다.`)
            continue
         }

         await order.update({
            orderTrackingNumber: 운송장번호,
            shippingCompany: 택배사,
            shippingStatus: '배송 중',
         })

         updatedCount++
      }

      res.json({ success: true, message: `${updatedCount}건의 운송장 번호가 등록되었습니다.` })
   } catch (error) {
      console.error('운송장 업로드 오류:', error)
      res.status(500).json({ success: false, message: '서버 오류 발생' })
   }
})

// 특정 프로젝트의 후원자 후원 목록 및 선물 통계 조회
router.get('/project/:id', async (req, res) => {
   try {
      const { id } = req.params

      const orders = await Order.findAll({
         where: { projectId: id },
         include: [
            { model: User, attributes: ['name'] },
            { model: Reward, attributes: ['id', 'name', 'price'] },
         ],
      })

      if (!orders.length) {
         return res.status(404).json({ success: false, message: '해당 프로젝트에 대한 후원 데이터가 없습니다.' })
      }

      const giftStatistics = await Order.findAll({
         attributes: ['rewardId', [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('userId'))), 'unique_supporters']],
         where: { projectId: id },
         include: [{ model: Reward, attributes: ['name'] }],
         group: ['rewardId'],
      })

      const totalSupporters = await Order.count({
         distinct: true,
         col: 'userId',
         where: { projectId: id },
      })

      res.json({ success: true, orders, giftStatistics, totalSupporters })
   } catch (error) {
      console.error('후원 목록 및 선물 통계 조회 오류:', error)
      res.status(500).json({ success: false, message: '서버 오류 발생', error: error.message })
   }
})

// 특정 후원 상세 조회
router.get('/:orderId', async (req, res) => {
   try {
      const { orderId } = req.params
      const order = await Order.findByPk(orderId, {
         include: [
            { model: User, attributes: ['id', 'name', 'email'] },
            { model: Reward, attributes: ['name', 'price'] },
            { model: Project, attributes: ['title'] },
         ],
      })

      if (!order) {
         return res.status(404).json({
            success: false,
            message: '해당 후원을 찾을 수 없습니다.',
         })
      }

      res.json({
         success: true,
         order,
         message: '후원 상세 정보 조회 성공',
      })
   } catch (error) {
      console.error('후원 상세 조회 오류:', error)
      res.status(500).json({
         success: false,
         message: '후원 상세 정보를 불러오는 중 오류가 발생했습니다.',
      })
   }
})

// 후원 생성
router.post('/', async (req, res) => {
   try {
      const { userId, projectId, rewardId, orderCount, orderPrice, address, account } = req.body

      const order = await Order.create({
         userId,
         projectId,
         rewardId,
         orderCount,
         orderPrice,
         address,
         account,
         orderStatus: 'ON_FUNDING',
      })

      res.json({
         success: true,
         order,
         message: '후원이 성공적으로 생성되었습니다.',
      })
   } catch (error) {
      console.error('후원 생성 오류:', error)
      res.status(500).json({
         success: false,
         message: '후원 생성 중 오류가 발생했습니다.',
      })
   }
})

// 후원 상태 업데이트 (운송장 번호 추가 및 상태 변경)
router.put('/:orderId', isCreator, async (req, res) => {
   try {
      const { orderId } = req.params
      const { orderStatus, bill } = req.body

      const order = await Order.findByPk(orderId)
      if (!order) {
         return res.status(404).json({
            success: false,
            message: '해당 후원을 찾을 수 없습니다.',
         })
      }

      await order.update({
         orderStatus: orderStatus || order.orderStatus,
         bill: bill || order.bill,
      })

      res.json({
         success: true,
         order,
         message: '후원 정보가 성공적으로 업데이트되었습니다.',
      })
   } catch (error) {
      console.error('후원 업데이트 오류:', error)
      res.status(500).json({
         success: false,
         message: '후원 정보 업데이트 중 오류가 발생했습니다.',
      })
   }
})

// 주문 삭제 (관리자/창작자만 가능)
router.delete('/:orderId', isCreator, async (req, res) => {
   try {
      const { orderId } = req.params

      const order = await Order.findByPk(orderId)
      if (!order) {
         return res.status(404).json({
            success: false,
            message: '해당 후원을 찾을 수 없습니다.',
         })
      }

      await order.destroy()

      res.json({
         success: true,
         message: '후원이 성공적으로 삭제되었습니다.',
      })
   } catch (error) {
      console.error('후원 삭제 오류:', error)
      res.status(500).json({
         success: false,
         message: '후원 삭제 중 오류가 발생했습니다.',
      })
   }
})

module.exports = router
