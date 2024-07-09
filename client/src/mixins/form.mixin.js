import messagesMixin from "./messages.mixin";

export default {
    data() {
        return {
            serverErrors: {},
        }
    },
    mixins: [messagesMixin],
    computed: {
        rulesWithServerValidation() {
            let rules = this.rules || [];

            // add server errors
            for (let key in (this.form || {})) {
                    rules[key] = rules[key] || [];
                    rules[key].push({
                    validator: this.validateServerErrors,
                    trigger: 'blur'
                });
            }

            return rules;
        }
    },
    methods: {
        validateServerErrors(rule, value, callback) {
            if (this.serverErrors[rule.field]) {
              let errorsMessages = this.serverErrors[rule.field].join(', ');
              delete this.serverErrors[rule.field];
              callback(new Error(errorsMessages));
            } else {
              callback();
            }
        },
        submitForm() {
            this.$refs.form.validate(async (valid) => {
                if (valid) {
                  try {
                    this.showLoadingMessage();
                    let result = await this.submitAction();
        
                    if (result.success) {
                        this.onSubmitSuccess(result);
                    } else {
                      throw new Error('server didn\'t return success');
                    }
                  }
                  catch(err) {
                    if (err.response && err.response.status === 400 && err.response.data.errors) {
                      const errors = err.response.data.errors;
                      this.serverErrors = errors;
                      this.$refs.form.validate(() => {});             
                    } else {
                      console.error(err);
                      this.addErrorMessage("There was an error. Please try again. If the problem persists, please contact us.");
                    }
                  } finally {
                    this.hideLoadingMessage();
                  }
                }
            });
        }
    },
}