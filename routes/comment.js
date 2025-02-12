const express = require('express')
const router = express.Router()
const { StudioCommunityComment, User } = require('../models')
const { isLoggedIn } = require('./middlewares')

// 댓글 생성
router.post('/', isLoggedIn, async (req, res) => {
   try {
      console.log('댓글 요청 데이터:', req.body) // 요청 데이터 로깅
      const { comment, communityId } = req.body

      if (!comment || !communityId) {
         return res.status(400).json({ success: false, message: '내용과 게시물 ID가 필요합니다.' })
      }

      const newComment = await StudioCommunityComment.create({
         comment,
         communityId,
         userId: req.user.id,
      })

      const createdComment = {
         id: newComment.id,
         comment: newComment.comment,
         communityId: newComment.communityId,
         userId: newComment.userId,
         name: req.user.name,
         imgUrl: req.user.imgUrl,
      }

      res.json({
         success: true,
         comment: createdComment,
         message: '댓글이 성공적으로 등록되었습니다.',
      })
   } catch (error) {
      console.error('댓글 생성 중 오류:', error)
      res.status(500).json({ success: false, message: '댓글 생성 중 오류가 발생했습니다.' })
   }
})

// 특정 게시물의 댓글 가져오기 (페이징 포함)
router.get('/', async (req, res) => {
   try {
      console.log('댓글 조회 요청 데이터:', req.query) // 로그 추가
      const { communityId, page = 1, limit = 10 } = req.query

      if (!communityId) {
         return res.status(400).json({ success: false, message: '게시물 ID가 필요합니다.' })
      }

      const offset = (page - 1) * limit

      const { count, rows } = await StudioCommunityComment.findAndCountAll({
         where: { communityId },
         include: [
            {
               model: User,
               attributes: ['name', 'imgUrl'],
            },
         ],
         limit: parseInt(limit, 10),
         offset: parseInt(offset, 10),
         order: [['createdAt', 'DESC']],
      })

      res.json({
         success: true,
         comments: rows,
         pagination: {
            total: count,
            page: parseInt(page, 10),
            totalPages: Math.ceil(count / limit),
            limit: parseInt(limit, 10),
         },
         message: '댓글을 성공적으로 불러왔습니다.',
      })
   } catch (error) {
      console.error('댓글 불러오기 중 오류:', error)
      res.status(500).json({ success: false, message: '댓글 불러오기 중 오류가 발생했습니다.' })
   }
})

// 댓글 수정
router.put('/:id', isLoggedIn, async (req, res) => {
   try {
      const { id } = req.params
      const { comment } = req.body

      const existingComment = await StudioCommunityComment.findOne({
         where: { id, userId: req.user.id }, // 수정: UserId → userId
      })

      if (!existingComment) {
         return res.status(404).json({ success: false, message: '댓글을 찾을 수 없거나 권한이 없습니다.' })
      }

      await existingComment.update({ comment })

      res.json({
         success: true,
         comment: existingComment,
         message: '댓글이 성공적으로 수정되었습니다.',
      })
   } catch (error) {
      console.error('댓글 수정 중 오류:', error)
      res.status(500).json({ success: false, message: '댓글 수정 중 오류가 발생했습니다.' })
   }
})

// 댓글 삭제
router.delete('/:id', isLoggedIn, async (req, res) => {
   try {
      const { id } = req.params

      const existingComment = await StudioCommunityComment.findOne({
         where: { id, userId: req.user.id }, // 수정: UserId → userId
      })

      if (!existingComment) {
         return res.status(404).json({ success: false, message: '댓글을 찾을 수 없거나 권한이 없습니다.' })
      }

      await existingComment.destroy()

      res.json({
         success: true,
         message: '댓글이 성공적으로 삭제되었습니다.',
      })
   } catch (error) {
      console.error('댓글 삭제 중 오류:', error)
      res.status(500).json({ success: false, message: '댓글 삭제 중 오류가 발생했습니다.' })
   }
})

module.exports = router
