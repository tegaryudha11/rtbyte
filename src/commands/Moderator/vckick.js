const { Command } = require('klasa');
const Case = require('../../lib/structures/Case');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['vk', 'vck'],
			permissionLevel: 5,
			requiredPermissions: ['MANAGE_CHANNELS', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'SEND_MESSAGES', 'EMBED_LINKS'],
			runIn: ['text'],
			description: language => language.get('COMMAND_VCKICK_DESCRIPTION'),
			usage: '<member:user> <reason:...string>',
			usageDelim: ' '
		});
		this.customizeResponse('member', message =>
			message.language.get('COMMAND_VCKICK_NOPARAM_MEMBER'))
			.customizeResponse('reason', message =>
				message.language.get('COMMAND_VCKICK_NOPARAM_REASON'));
	}

	async run(msg, [user, ...reason]) {
		const silent = reason[0].endsWith('-s');
		if (user.id === msg.author.id) return msg.reject(msg.language.get('COMMAND_VCKICK_NO_VCKICK_SELF'));
		if (user.id === this.client.user.id) return msg.reject(msg.language.get('COMMAND_VCKICK_NO_VCKICK_CLIENT'));
		if (!await msg.member.canMod(user)) return msg.reject(msg.language.get('COMMAND_VCKICK_NO_PERMS', user));

		const modCase = new Case(msg.guild)
			.setUser(user)
			.setType('vckick')
			.setReason(reason)
			.setModerator(msg.author)
			.setSilent(silent);
		await modCase.submit();

		const member = await msg.guild.members.fetch(user);

		if (!member.voice) return msg.affirm();

		const tempVC = await msg.guild.channels.create(member.id, { type: 'voice', userLimit: 1, reason: `Temporary Channel to kick ${member.user.tag} from voice chat.` });
		await member.setVoiceChannel(tempVC);
		await setTimeout(() => tempVC.delete(`Deleting Channel to kick ${member.user.tag} from voice chat.`), 250);

		const embed = await modCase.embed();
		await embed.send();

		if (silent) return msg.delete({ reason: msg.language.get('COMMAND_MODERATION_SILENT') });

		return msg.affirm();
	}

};