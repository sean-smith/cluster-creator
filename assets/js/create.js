// Click handler (jquery)

$(function() {

  $("#queue_1_slider").slider({});
  $("#fsx_capacity").slider({});
  $("#root_volume_size").slider({});
  $("#num_queues").slider({});

  $("#options").change(function() {
    config()
	});

  config();

  function queues (options){
    template = `Scheduling:
    Scheduler: slurm
    SlurmQueues:`;
    for (let i = 1; i < 6; i++) {
      if (i <= parseInt(options['num_queues'])) {
        $(`#queue_${i}`).show();
        template += `
      - Name: ${options[`queue_${i}_name`]}
        ComputeResources:
        - Name: ${options[`queue_${i}_name`]}
          DisableSimultaneousMultithreading: ${options[`queue_${i}_disable_hyperthreading`]}
          InstanceType: ${options[`queue_${i}_instance_type`]}
          MinCount: ${options[`queue_${i}_slider_min`]}
          MaxCount: ${options[`queue_${i}_slider_max`]}`;
      } else {
        $(`#queue_${i}`).hide();
      }
    }
    return template;
  }

  function image (options){
    template_image = {};
    template_image['Os'] = options['Os'];
    options['CustomAmi_on'] ? template_image['CustomAmi'] = options['CustomAmi']: "";
    return template_image;
  }


  function config(){

    const options = new Map();

    $('.pcluster-option').each(function(i, obj) {
      id = $(obj).attr('id');
      obj = $(`#${id}`);
      switch (obj.attr('type')) {
        case 'min-max-slider':
          options[`${id}_min`] = obj.val().split(',')[0];
          options[`${id}_max`] = obj.val().split(',')[1];
          break;
        case 'checkbox':
          console.log(`id = ${id}, type = ${obj.attr('type')}, val = ${obj.val()}`)
          options[id] = obj.is(":checked");
          break;
        default:
          options[id] = obj.val();
          break;
      }
    });

    template = "";
    template_obj = {};

    template_obj['Image'] = image(options, template_obj);

  template += `
HeadNode:
  InstanceType: ${options['head_node_instance_type']}
  DisableSimultaneousMultithreading: ${options['disable_hyperthreading']}
  Networking:
    SubnetId: ${options['subnet_id']}
  Ssh:
    KeyName: ${options['key_name']}
  Imds:
    Secured: true`;
    
  template += queues(options);
  

  
  

template += `
SharedStorage:
  - Name: fsx
    MountDir: ${options['fsx_mount_point']}
    StorageType: FsxLustre
    FsxLustreSettings:
      StorageCapacity: ${options['fsx_capacity']}
      DeploymentType: SCRATCH_2`;
      


      // $("#code").html(template);
      $("#code").html(jsyaml.dump(template_obj));
      
  }


});
