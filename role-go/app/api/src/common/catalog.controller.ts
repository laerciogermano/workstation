import { Controller, Get } from '@nestjs/common'
import { EVENT_TYPES, RADIUS_DEFAULT_KM, RADIUS_MAX_KM, RADIUS_MIN_KM, SUGGESTED_CITIES } from './catalog'

@Controller('catalog')
export class CatalogController {
  @Get()
  catalog() {
    return {
      eventTypes: EVENT_TYPES,
      cities: SUGGESTED_CITIES,
      radius: { min: RADIUS_MIN_KM, max: RADIUS_MAX_KM, default: RADIUS_DEFAULT_KM },
    }
  }

  @Get('health')
  health() {
    return { ok: true }
  }
}
