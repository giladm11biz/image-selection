<template>
    <div v-if="errors && errors.length > 0" class="errors-list input-error">
        <div v-for="error in errors" :key="error">
            {{ error }}
        </div>
    </div>
</template>
  
  <script>
  export default {
    name: 'ShowErros',
    props: {
        errors: {
            type: Array,
        }
    }
  }
  </script>
  
  <!-- Add "scoped" attribute to limit CSS to this component only -->
  <style scoped>
  </style>
  