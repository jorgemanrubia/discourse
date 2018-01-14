import UserBadge from 'discourse/models/user-badge';

export default Ember.Controller.extend({
  adminUser: Ember.inject.controller(),
  user: Ember.computed.alias('adminUser.model'),

  sortedBadges: Ember.computed.sort('model', 'badgeSortOrder'),
  badgeSortOrder: ['granted_at:desc'],

  groupedBadges: function(){
    const allBadges = this.get('model');

    var grouped = _.groupBy(allBadges, badge => badge.badge_id);

    var expanded = [];
    const expandedBadges = allBadges.get('expandedBadges');

    _(grouped).each(function(badges){
      var lastGranted = badges[0].granted_at;

      _.each(badges, function(badge) {
        lastGranted = lastGranted < badge.granted_at ? badge.granted_at : lastGranted;
      });

      if(badges.length===1 || _.include(expandedBadges, badges[0].badge.id)){
        _.each(badges, badge => expanded.push(badge));
        return;
      }

      var result = {
        badge: badges[0].badge,
        granted_at: lastGranted,
        badges: badges,
        count: badges.length,
        grouped: true
      };

      expanded.push(result);
    });

    return _(expanded).sortBy(group => group.granted_at).reverse().value();
  }.property('model', 'model.[]', 'model.expandedBadges.[]'),

  /**
    Array of badges that have not been granted to this user.

    @property grantableBadges
    @type {Boolean}
  **/
  grantableBadges: function() {
    return UserBadge.calculateGrantableBadges(this.get('badges'), this.get('model'));
  }.property('badges.[]', 'model.[]'),

  /**
    Whether there are any badges that can be granted.

    @property noBadges
    @type {Boolean}
  **/
  noBadges: Em.computed.empty('grantableBadges'),

  actions: {

    expandGroup: function(userBadge){
      const model = this.get('model');
      model.set('expandedBadges', model.get('expandedBadges') || []);
      model.get('expandedBadges').pushObject(userBadge.badge.id);
    },

    grantBadge(badgeId) {
      UserBadge.grant(badgeId, this.get('user.username'), this.get('badgeReason')).then(userBadge => {
        this.set('badgeReason', '');
        this.get('model').pushObject(userBadge);
        Ember.run.next(() => {
          // Update the selected badge ID after the combobox has re-rendered.
          const newSelectedBadge = this.get('grantableBadges')[0];
          if (newSelectedBadge) {
            this.set('selectedBadgeId', newSelectedBadge.get('id'));
          }
        });
      }, function() {
        // Failure
        bootbox.alert(I18n.t('generic_error'));
      });
    },

    revokeBadge(userBadge) {
      return bootbox.confirm(I18n.t("admin.badges.revoke_confirm"), I18n.t("no_value"), I18n.t("yes_value"), result => {
        if (result) {
          userBadge.revoke().then(() => {
            this.get('model').removeObject(userBadge);
          });
        }
      });
    }

  }
});
