const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const { Project, Studio, BannerProject, Order } = require('../models')
const { Sequelize } = require('sequelize')

// 폴더가 없을 경우 새로 생성
try {
   fs.readdirSync('uploads/bannerProject') //해당 폴더가 있는지 확인
} catch (error) {
   fs.mkdirSync('uploads/bannerProject') //폴더 생성
}

// 이미지 업로드를 위한 multer 설정
const bannerUpload = multer({
   // 저장할 위치와 파일명 지정
   storage: multer.diskStorage({
      destination(req, file, cb) {
         cb(null, 'uploads/bannerProject')
      },
      filename(req, file, cb) {
         const decodedFileName = decodeURIComponent(file.originalname)
         const ext = path.extname(decodedFileName) //확장자
         const basename = path.basename(decodedFileName, ext) //확장자 제거한 파일명

         cb(null, basename + '_' + Date.now() + ext)
      },
   }),
   // 파일의 크기 제한
   limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
})

// 관리자용 목록 호출
router.get('/', async (req, res) => {
   try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 8
      const offset = (page - 1) * limit
      const count = await Project.count({
         where: {
            proposalStatus: { [Sequelize.Op.not]: 'WRITING' },
         },
      })
      const projects = await Project.findAll({
         limit,
         offset,
         subQuery: false,
         where: {
            proposalStatus: { [Sequelize.Op.not]: 'WRITING' },
         },
         attributes: {
            include: [[Sequelize.fn('SUM', Sequelize.col('Orders.orderPrice')), 'totalOrderPrice']], // orderPrice 합계 계산
         },
         order: [['UpdatedAt', 'DESC']],
         include: [
            {
               model: Studio,
               attributes: ['name'],
            },
            {
               model: BannerProject,
               attributes: ['id'],
            },
            {
               model: Order,
               attributes: [],
               required: false,
            },
         ],
         group: ['Project.id', 'BannerProject.id'],
      })
      res.json({
         success: true,
         projects,
         count,
         message: '관리자용 목록 호출 성공',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '관리자용 목록을 호출하는데 문제가 발생했습니다.' })
   }
})

// 배너 등록
router.post('/banner/reg', bannerUpload.single('banner'), async (req, res) => {
   try {
      const pid = req.body.id
      // 업로드된 파일 확인
      if (!req.file) {
         return res.status(400).json({ success: false, message: '파일 업로드에 실패했습니다.' })
      }
      await BannerProject.create({
         projectId: pid,
         imgUrl: `/${req.file.filename}`,
      })
      res.json({
         success: true,
         message: '배너가 등록되었습니다',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '배너 등록중 오류가 발생했습니다.', error })
   }
})

// 배너 해제
router.delete('/banner/del/:bid', async (req, res) => {
   try {
      const { bid } = req.params
      await BannerProject.destroy({
         where: {
            id: bid,
         },
      })
      res.json({
         success: true,
         message: '배너가 해제되었습니다',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '배너 해제중 오류가 발생했습니다.', error })
   }
})

// 승인 허가
router.patch('/proposal/pass/:id', async (req, res) => {
   try {
      const { id } = req.params
      await Project.update({ proposalStatus: 'COMPLETE' }, { where: { id } })
      res.json({
         success: true,
         message: '승인이 허가되었습니다.',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '승인 허가중 오류가 발생했습니다.', error })
   }
})

// 승인 거부
router.patch('/proposal/deny', async (req, res) => {
   try {
      const { id, denyMsg } = req.body
      await Project.update({ proposalStatus: 'DENIED', adminMemo: denyMsg }, { where: { id } })
      res.json({
         success: true,
         message: '승인이 허가되었습니다.',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '승인 거부중 오류가 발생했습니다.', error })
   }
})

module.exports = router
