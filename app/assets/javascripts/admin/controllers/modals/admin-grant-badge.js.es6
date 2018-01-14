import ModalFunctionality from 'discourse/mixins/modal-functionality';
import computed from 'ember-addons/ember-computed-decorators';
import UserBadge from 'discourse/models/user-badge';
import Badge from 'discourse/models/badge';

export default Ember.Controller.extend(ModalFunctionality, {
  loading: null,
  saving: null,
  userBadges: null,
  allBadges: null,
  post: null,
  username: Ember.computed.alias('post.username'),

  onShow() {
    this.set('loading', true);
  },

  loadBadges(post) {
    this.set('post', post);
    this._findBadges().then(result => {
      this.set('userBadges', result.userBadges);
      this.set('allBadges', result.allBadges);
    }).finally(() => this.set('loading', false));
  },

  _findBadges(){
    const userBadges = UserBadge.findByUsername(this.get('username'));
    const allBadges = Badge.findAll();

    return Ember.RSVP.hash({
      userBadges,
      allBadges
    });
  },

  @computed('userBadges.[]', 'allBadges.[]')
  grantableBadges(badges) {
    var granted = {};
    this.get('userBadges').forEach(function (userBadge) {
      granted[userBadge.get('badge_id')] = true;
    });

    var badges = [];
    this.get('allBadges').forEach(function (badge) {
      if (badge.get('enabled') && (badge.get('multiple_grant') || !granted[badge.get('id')])) {
        badges.push(badge);
      }
    });

    return _.sortBy(badges, badge => badge.get('name'));
  },

  actions: {
    grantBadge(badgeId) {
      const badgeReason = this.get('post.url');
      this.set('saving', true);
      UserBadge.grant(badgeId, this.get('username'), badgeReason).then(userBadge => {
        this.set('saving', false);
        this.send("closeModal");
      }, function () {
        bootbox.alert(I18n.t('generic_error'));
      });
    }
  }
});
