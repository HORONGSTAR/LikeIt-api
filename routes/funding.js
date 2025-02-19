const express = require('express')
const { Studio, Project, User, Order, Reward, RewardProduct, ProjectBudget } = require('../models')
const router = express.Router()

const { Sequelize } = require('sequelize')

// 특정 프로젝트 호출
router.get('/:id', async (req, res) => {
   try {
      const { id } = req.params
      const funding = await Project.findOne({
         subQuery: false,
         where: { id },
         include: [
            {
               model: Studio,
               attributes: ['id', 'name', 'intro', 'imgUrl', [Sequelize.fn('COUNT', Sequelize.col('Studio.Users.id')), 'subscribers']],
               include: [
                  {
                     model: User,
                     through: {
                        attributes: [],
                     },
                     attributes: [],
                  },
               ],
            },
            {
               model: Order,
               attributes: [],
               required: false,
            },
            {
               model: Reward,
               required: false,
               include: [
                  {
                     model: RewardProduct,
                     through: {
                        attributes: ['stock'],
                     },
                  },
               ],
            },
            {
               model: ProjectBudget,
            },
         ],
         attributes: {
            include: [[Sequelize.fn('SUM', Sequelize.col('Orders.orderPrice')), 'totalOrderPrice']],
         },
         group: ['Rewards.id', 'Rewards.RewardProducts.id', 'ProjectBudgets.id'],
      })
      res.json({
         success: true,
         message: '펀딩 프로젝트 조회 성공',
         funding,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({
         success: false,
         message: '펀딩 프로젝트를 불러오는데 문제가 발생했습니다.',
      })
   }
})

module.exports = router
