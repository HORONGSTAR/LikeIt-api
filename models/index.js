const Sequelize = require('sequelize')
const env = process.env.NODE_ENV || 'development'
const config = require('../config/config')[env]

const Address = require('./address')
const BannerProject = require('./bannerProject')
const Category = require('./category')
const Creator = require('./creator')
const CreatorBudget = require('./creatorBudget')
const CreatorProfit = require('./creatorProfit')
const Message = require('./message')
const Order = require('./order')
const Point = require('./point')
const Project = require('./project')
const ProjectBudget = require('./projectBudget')
const ProjectReview = require('./projectReview')
const ProjectTimeline = require('./projectTimeline')
const ProjectTimelineComment = require('./projectTimelineComment')
const Reward = require('./reward')
const RewardProduct = require('./rewardProduct')
const RewardProductRelation = require('./rewardProductRelation')
const Studio = require('./studio')
const StudioAccount = require('./studioAccount')
const StudioCommunity = require('./studioCommunity')
const StudioCommunityComment = require('./studioCommunityComment')
const StudioCreator = require('./studioCreator')
const User = require('./user')
const UserAccount = require('./userAccount')
const CronJobLog = require('./CronJobLog')

const db = {}
const sequelize = new Sequelize(config.database, config.username, config.password, config)

db.sequelize = sequelize
db.Address = Address
db.BannerProject = BannerProject
db.Category = Category
db.Creator = Creator
db.CreatorBudget = CreatorBudget
db.CreatorProfit = CreatorProfit
db.Message = Message
db.Order = Order
db.Point = Point
db.Project = Project
db.ProjectBudget = ProjectBudget
db.ProjectReview = ProjectReview
db.ProjectTimeline = ProjectTimeline
db.ProjectTimelineComment = ProjectTimelineComment
db.Reward = Reward
db.RewardProduct = RewardProduct
db.RewardProductRelation = RewardProductRelation
db.Studio = Studio
db.StudioAccount = StudioAccount
db.StudioCommunity = StudioCommunity
db.StudioCommunityComment = StudioCommunityComment
db.StudioCreator = StudioCreator
db.User = User
db.UserAccount = UserAccount
db.CronJobLog = CronJobLog

Address.init(sequelize)
BannerProject.init(sequelize)
Category.init(sequelize)
Creator.init(sequelize)
CreatorBudget.init(sequelize)
CreatorProfit.init(sequelize)
Message.init(sequelize)
Order.init(sequelize)
Point.init(sequelize)
Project.init(sequelize)
ProjectBudget.init(sequelize)
ProjectReview.init(sequelize)
ProjectTimeline.init(sequelize)
ProjectTimelineComment.init(sequelize)
Reward.init(sequelize)
RewardProduct.init(sequelize)
RewardProductRelation.init(sequelize)
Studio.init(sequelize)
StudioAccount.init(sequelize)
StudioCommunity.init(sequelize)
StudioCommunityComment.init(sequelize)
StudioCreator.init(sequelize)
User.init(sequelize)
UserAccount.init(sequelize)
CronJobLog.init(sequelize)

Address.associate(db)
BannerProject.associate(db)
Category.associate(db)
Creator.associate(db)
CreatorBudget.associate(db)
CreatorProfit.associate(db)
Message.associate(db)
Order.associate(db)
Point.associate(db)
Project.associate(db)
ProjectBudget.associate(db)
ProjectReview.associate(db)
ProjectTimeline.associate(db)
ProjectTimelineComment.associate(db)
Reward.associate(db)
RewardProduct.associate(db)
RewardProductRelation.associate(db)
Studio.associate(db)
StudioAccount.associate(db)
StudioCommunity.associate(db)
StudioCommunityComment.associate(db)
StudioCreator.associate(db)
User.associate(db)
UserAccount.associate(db)
CronJobLog.associate(db)

module.exports = db
