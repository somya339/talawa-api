const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const adminCheck = require("../functions/adminCheck");
const Event = require("../../models/Event");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //find event
    let event = await Event.findOne({ _id: args.eventId });
    if (!event) throw new Error("Event does not exist");

    //ensure organization exists
    let org = await Organization.findOne({ _id: event.organization });
    if (!org) throw new Error("Organization not found");

    //ensure user is an admin
    adminCheck(context, org);

    //gets user in token - to be used later on
    let user = await User.findOne({ _id: context.userId });
    if (!user) {
      throw new Error("User does not exist");
    }

    //remove event from user
    user.overwrite({
      ...user._doc,
      eventAdmin: user._doc.eventAdmin.filter(
        (eventAdmin) => eventAdmin != event.id
      ),
      createdEvents: user._doc.createdEvents.filter(
        (createdEvent) => createdEvent != event.id
      ),
      registeredEvents: user._doc.registeredEvents.filter(
        (registeredEvent) => registeredEvent != event.id
      ),
    });

    await user.save();

    //delete post
    await Event.deleteOne({ _id: args.eventId });

    //return user
    return {
      ...event._doc,
    };
  } catch (e) {
    throw e;
  }
};
