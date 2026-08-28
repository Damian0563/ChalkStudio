<template>


</template>

<script setup lang="ts">
import type { BoardUser } from '~/types/board'
const users = defineModel<Map<string, BoardUser>>('users', { required: true })

</script>
