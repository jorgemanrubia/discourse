import ModalFunctionality from 'discourse/mixins/modal-functionality';
import computed from 'ember-addons/ember-computed-decorators';
import UserBadge from 'discourse/models/user-badge';
import Badge from 'discourse/models/badge';

export default Ember.Controller.extend(ModalFunctionality, {
  loading: null,
  saving: null,
  allBadges: null,
  userBadges: null,
  post: null,
  username: Ember.computed.alias('post.username'),

  onShow() {
    this.set('loading', true);
  },

  loadBadges(post) {
    this.set('post', post);
    this._findBadges().then(result => {
      this.set('allBadges', result.allBadges);
      this.set('userBadges', result.userBadges);
      this._selectFirstBadge();
    }).finally(() => this.set('loading', false));
  },

  _findBadges(){
    const allBadges = Badge.findAll();
    const userBadges = UserBadge.findByUsername(this.get('username'));

    return Ember.RSVP.hash({
      allBadges,
      userBadges
    });
  },

  _selectFirstBadge(){
    const grantableBadges = this.get('grantableBadges');

    if (grantableBadges.length > 0)
      this.set('selectedBadgeId', grantableBadges[0].get('id'));
  },

  @computed('userBadges.[]', 'allBadges.[]')
  grantableBadges() {
    return Badge.calculateGrantableBadges(this.get('allBadges'), this.get('userBadges').mapBy('badge_id'));
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
