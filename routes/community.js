const express = require('express')
const { StudioCommunity, User, StudioCommunityComment } = require('../models')

const router = express.Router()

// 커뮤니티 목록 조회
router.get('/list', async (req, res) => {
   try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 4
      const offset = (page - 1) * limit
      const communities = await StudioCommunity.findAll({
         limit,
         offset,
         attributes: ['id', 'title', 'notice', 'createdAt'],
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
      res.json({ success: true, community })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '게시물을 불러오는 중 오류가 발생했습니다.', error })
   }
})

// 게시물 등록
router.post('/', async (req, res) => {
   try {
      const { title, contents, userId } = req.body

      if (!title || !contents || !userId) {
         return res.status(400).json({ success: false, message: '제목, 내용, 작성자 ID는 필수입니다.' })
      }

      const newPost = await StudioCommunity.create({
         title,
         contents,
         userId,
      })

      res.status(201).json({ success: true, community: newPost, message: '게시물이 등록되었습니다.' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '게시물 등록 중 오류가 발생했습니다.', error })
   }
})

// 게시물 수정
router.put('/:id', async (req, res) => {
   try {
      const { title, contents } = req.body
      const { id } = req.params

      const community = await StudioCommunity.findByPk(id)
      if (!community) {
         return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' })
      }

      await community.update({
         title: title || community.title,
         contents: contents || community.contents,
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
