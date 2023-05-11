import { roleRights } from '../config/roles.config.js'
import { ApplicationError } from '../helper/errors.helper.js'

export const verifyRights = (...requiredRights) => (req, res, next) => {
  if (requiredRights?.length) {
    const userRights = roleRights.get(req.user?.type)

    const hasRequiredRights = requiredRights.every((requiredRight) =>
      userRights.includes(requiredRight),
    )

    console.log(req.user.id, 'user id')

    if (!hasRequiredRights && req.params.userId !== req.user.id) {
      throw new ApplicationError(
        401,
        'You are not authorized to use this endpoint',
      )
    }
  }
  next()
}
